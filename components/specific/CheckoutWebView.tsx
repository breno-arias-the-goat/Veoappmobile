import React, { useState } from 'react';
import { Modal, View, ActivityIndicator, SafeAreaView, TouchableOpacity, Text, Platform } from 'react-native';
import WebView from 'react-native-webview';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { STRIPE_URLS } from '../../config/stripe';

interface CheckoutWebViewProps {
    checkoutUrl: string | null;
    isVisible: boolean;
    onSuccess: () => void;
    onCancel: () => void;
}

export function CheckoutWebView({ checkoutUrl, isVisible, onSuccess, onCancel }: CheckoutWebViewProps) {
    const [isLoading, setIsLoading] = useState(true);

    if (!checkoutUrl) return null;

    const handleNavigationStateChange = (navState: any) => {
        const url = navState.url;

        if (url.includes('payment/success') || url === STRIPE_URLS.successUrl) {
            onSuccess();
        }

        if (url.includes('payment/cancel') || url === STRIPE_URLS.cancelUrl) {
            onCancel();
        }
    };

    return (
        <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
                {/* Header with close button */}
                <View className="flex-row justify-between items-center p-md border-b border-gray-200 dark:border-gray-800">
                    <Text className="text-lg font-inter-semibold text-text-dark dark:text-text-light">
                        Checkout Seguro
                    </Text>
                    <TouchableOpacity onPress={onCancel} className="p-xs">
                        <FontAwesome name="times" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                </View>

                {/* WebView Content */}
                <View className="flex-1 relative">
                    {isLoading && (
                        <View className="absolute inset-0 items-center justify-center bg-background-light dark:bg-background-dark z-10">
                            <ActivityIndicator size="large" color="#3975F9" />
                            <Text className="mt-md font-inter text-gray-500">Conectando ao Stripe...</Text>
                        </View>
                    )}

                    {Platform.OS === 'web' ? (
                        <View className="flex-1 items-center justify-center p-xl">
                            <Text className="text-center font-inter text-gray-500 mb-4">
                                Pagamentos via WebView não são suportados nativamente nesta versão Web.
                            </Text>
                            <TouchableOpacity
                                className="bg-primary px-6 py-3 rounded-lg"
                                onPress={() => window.open(checkoutUrl, '_blank')}
                            >
                                <Text className="text-white font-inter-bold">Abrir Stripe Checkout Externo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <WebView
                            source={{ uri: checkoutUrl }}
                            onNavigationStateChange={handleNavigationStateChange}
                            onLoadEnd={() => setIsLoading(false)}
                            startInLoadingState={false} // Managed custom loading state above
                            bounces={false}
                        />
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}
