import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, Animated } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const typeStyles: Record<ToastType, string> = {
        success: 'bg-green-600 border-green-400',
        error: 'bg-red-700 border-red-400',
        warning: 'bg-orange-600 border-orange-400',
        info: 'bg-primary border-primary/50',
    };

    const typeIcons: Record<ToastType, string> = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container - positioned absolutely at top */}
            <View
                style={{
                    position: 'absolute',
                    top: 60,
                    left: 16,
                    right: 16,
                    zIndex: 9999,
                    pointerEvents: 'none',
                }}
            >
                {toasts.map(toast => (
                    <View
                        key={toast.id}
                        style={{
                            marginBottom: 8,
                            borderRadius: 30, // Pill shape
                            borderWidth: 1,
                            paddingHorizontal: 20,
                            paddingVertical: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.5,
                            shadowRadius: 16,
                            backgroundColor: '#13131A', // Dark surface
                            borderColor: toast.type === 'success' ? '#10B981' :
                                toast.type === 'error' ? '#EF4444' :
                                    toast.type === 'warning' ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                        }}
                    >
                        <Text style={{ marginRight: 12, fontSize: 16 }}>
                            {typeIcons[toast.type]}
                        </Text>
                        <Text style={{ flex: 1, color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                            {toast.message}
                        </Text>
                    </View>
                ))}
            </View>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
