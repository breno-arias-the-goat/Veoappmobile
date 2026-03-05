import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import api, { setApiToken } from '../lib/api';
import { getMe, loginUser, signupUser, updateProfile } from '../services/authService';

type UserProfile = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string | null;
};

type AuthContextType = {
    token: string | null;
    user: UserProfile | null;
    userEmail: string | null;
    subscriptionStatus: 'free' | 'pro';
    isLoading: boolean;
    signIn: (credentials: any) => Promise<void>;
    signUp: (userData: any) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUserProfile: (data: { firstName?: string; lastName?: string }) => Promise<void>;
    refreshSubscriptionStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getStoredToken(): Promise<string | null> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return localStorage.getItem('userToken');
    }
    return AsyncStorage.getItem('userToken');
}

async function persistToken(token: string): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem('userToken', token);
    } else {
        await AsyncStorage.setItem('userToken', token);
    }
}

async function clearToken(): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem('userToken');
    } else {
        await AsyncStorage.removeItem('userToken');
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro'>('free');
    const [isLoading, setIsLoading] = useState(true);

    // ── Derived from user ──────────────────────────────────────────────────────
    const userEmail = user?.email ?? null;

    // ── Startup: restore stored token & fetch user profile ────────────────────
    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await getStoredToken();
                if (storedToken) {
                    setApiToken(storedToken);
                    setToken(storedToken);
                    // Load real user data from backend
                    try {
                        const me = await getMe();
                        if (me) {
                            setUser(me);
                            // Restaurar status de assinatura após login
                            if (me.email) {
                                try {
                                    const { data } = await api.get(`/subscriptions/status?email=${encodeURIComponent(me.email)}`);
                                    if (data?.status) {
                                        setSubscriptionStatus(data.status as 'free' | 'pro');
                                    }
                                } catch (_) { /* mantém 'free' se falhar */ }
                            }
                        }
                    } catch (_) { /* token may be expired, handled at signIn */ }
                }
            } catch (e) {
                console.error('Failed to load token', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadToken();
    }, []);

    const signIn = async (credentials: any) => {
        const responseData = await loginUser(credentials);
        const accessToken = responseData?.data?.tokens?.accessToken;
        const userData = responseData?.data?.user;
        if (accessToken) {
            setApiToken(accessToken);
            setToken(accessToken);
            if (userData) setUser(userData);
            await persistToken(accessToken);
        }
    };

    const signUp = async (userData: any) => {
        const responseData = await signupUser(userData);
        const accessToken = responseData?.data?.tokens?.accessToken;
        const userInfo = responseData?.data?.user;
        if (accessToken) {
            setApiToken(accessToken);
            setToken(accessToken);
            if (userInfo) setUser(userInfo);
            await persistToken(accessToken);
        }
    };

    const signOut = async () => {
        setApiToken(null);
        setToken(null);
        setUser(null);
        setSubscriptionStatus('free');
        await clearToken();
    };

    const refreshUser = async () => {
        try {
            const me = await getMe();
            if (me) setUser(me);
        } catch (err) {
            console.error('refreshUser failed:', err);
        }
    };

    const updateUserProfile = async (data: { firstName?: string; lastName?: string }) => {
        const updated = await updateProfile(data);
        if (updated) setUser(updated);
    };

    const refreshSubscriptionStatus = async () => {
        const email = user?.email;
        if (!email) {
            console.warn('refreshSubscriptionStatus: nenhum e-mail de usuário disponível.');
            return;
        }
        try {
            const { data } = await api.get(`/subscriptions/status?email=${encodeURIComponent(email)}`);
            if (data?.status) {
                setSubscriptionStatus(data.status as 'free' | 'pro');
                console.log(`✅ Subscription status atualizado: ${data.status}`);
            }
        } catch (err) {
            console.error('refreshSubscriptionStatus falhou:', err);
        }
    };

    return (
        <AuthContext.Provider value={{
            token,
            user,
            userEmail,
            subscriptionStatus,
            isLoading,
            signIn,
            signUp,
            signOut,
            refreshUser,
            updateUserProfile,
            refreshSubscriptionStatus,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
