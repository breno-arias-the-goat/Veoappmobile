import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as yup from 'yup';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Button } from '../../components/base/Button';
import { Input } from '../../components/base/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// Necessário para fechar o browser após o OAuth no Expo Go
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const { t } = useTranslation();

    const schema = yup.object({
        email: yup.string().email(t('auth.email_invalid')).required(t('auth.email_required')),
        password: yup.string().min(6, t('auth.password_min')).required(t('auth.password_required')),
    }).required();

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });
    const { signIn, signInWithGoogle } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Configurar Google OAuth com expo-auth-session
    // makeRedirectUri detecta automaticamente o ambiente:
    // - Expo Go: usa https://auth.expo.io/@username/slug
    // - Build nativa: usa viloteleprompterapp://
    const redirectUri = makeRedirectUri({
        scheme: 'viloteleprompterapp',
        path: 'auth',
    });

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        redirectUri,
    });

    // Processar resposta do Google OAuth
    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleGoogleLogin(authentication.accessToken);
            }
        } else if (response?.type === 'error') {
            showToast('Erro ao conectar com Google. Tente novamente.', 'error');
            setGoogleLoading(false);
        } else if (response?.type === 'dismiss') {
            setGoogleLoading(false);
        }
    }, [response]);

    const handleGoogleLogin = async (accessToken: string) => {
        try {
            setGoogleLoading(true);
            await signInWithGoogle(accessToken);
            showToast('Login com Google realizado com sucesso!', 'success');
        } catch (error: any) {
            const message = error.message || 'Erro ao fazer login com Google.';
            showToast(message, 'error');
        } finally {
            setGoogleLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            await signIn(data);
            showToast(t('auth.login_success'), 'success');
        } catch (error: any) {
            console.error('Login Error Breakdown:', error);
            const message = error.response?.data?.message || error.message || t('auth.auth_failure');
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center p-8 bg-background">
            <View className="items-center mb-10">
                <Image
                    source={require('../../assets/images/veo-logo.png')}
                    style={{ width: 240, height: 80 }}
                    resizeMode="contain"
                />
            </View>
            <View className="mb-12">
                <Text className="text-4xl font-inter-bold text-white mb-3 text-center tracking-tight">{t('auth.login_title')}</Text>
                <Text className="text-base font-inter-medium text-text-secondary text-center px-4">{t('auth.login_subtitle')}</Text>
            </View>

            <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                    <View className="mb-4">
                        <Input
                            label={t('auth.email_label')}
                            placeholder={t('auth.email_placeholder')}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {errors.email && <Text className="text-red-400 mt-1 text-sm">{errors.email.message}</Text>}
                    </View>
                )}
            />

            <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                    <View className="mb-8">
                        <Input
                            label={t('auth.password_label')}
                            placeholder={t('auth.password_placeholder')}
                            secureTextEntry
                            onChangeText={onChange}
                            value={value}
                        />
                        {errors.password && <Text className="text-red-400 mt-1 text-sm">{errors.password.message}</Text>}
                    </View>
                )}
            />

            <Button
                title={t('auth.enter_button')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
            />

            <View className="mt-8 flex-row justify-center">
                <Text className="text-text-secondary">{t('auth.no_account')}</Text>
                <Link href="/(auth)/signup" asChild>
                    <Text className="text-primary font-bold ml-1">{t('auth.signup_link')}</Text>
                </Link>
            </View>

            {/* Social Logins */}
            <View className="mt-8 px-4">
                <View className="flex-row items-center mb-6">
                    <View className="flex-1 h-[1px] bg-border/30" />
                    <Text className="mx-4 font-inter-medium text-text-secondary text-sm">Ou continue com</Text>
                    <View className="flex-1 h-[1px] bg-border/30" />
                </View>

                <View className="flex-row justify-between mb-8 space-x-4">
                     <TouchableOpacity
                        className="flex-1 h-14 bg-card rounded-xl border border-border/50 flex-row items-center justify-center"
                        onPress={() => {
                            setGoogleLoading(true);
                            promptAsync();
                        }}
                        disabled={!request || googleLoading}
                    >
                        {googleLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' }} style={{ width: 22, height: 22 }} />
                                <Text className="text-white ml-3 font-inter-semibold">Google</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
