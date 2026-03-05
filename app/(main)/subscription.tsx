import React, { useState } from 'react';
import { View, ScrollView, Text, ActivityIndicator, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useAuth } from '../../contexts/AuthContext';
import { usePlans, useStripeCheckout } from '../../hooks/useSubscription';
import { PlanCard } from '../../components/specific/PlanCard';
import { CheckoutWebView } from '../../components/specific/CheckoutWebView';
import type { PlanData } from '../../services/subscriptionService';

export default function SubscriptionScreen() {
    const { userEmail, refreshSubscriptionStatus } = useAuth();
    const { data: plans, isLoading: loadingPlans } = usePlans();
    const { mutate: createCheckout, isPending: creatingCheckout } = useStripeCheckout();

    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    const handleSelectPlan = (planId: string) => {
        if (planId.includes('free')) {
            Alert.alert('Plano Atual', 'Você já está no plano gratuito.');
            return;
        }

        setSelectedPlanId(planId);

        // ✅ Usa o email real do usuário logado (AuthContext)
        const email = userEmail || 'guest@vilo.app';

        createCheckout(
            { planId, email },
            {
                onSuccess: (data) => {
                    if (data?.checkoutUrl) {
                        setCheckoutUrl(data.checkoutUrl);
                    } else {
                        Alert.alert('Erro', 'Não foi possível gerar o link de pagamento.');
                    }
                },
                onError: () => {
                    setSelectedPlanId(null);
                    Alert.alert('Erro', 'Não foi possível iniciar o checkout. Tente novamente.');
                },
            }
        );
    };

    const handleCheckoutSuccess = async () => {
        setCheckoutUrl(null);
        setSelectedPlanId(null);
        await refreshSubscriptionStatus();
        Alert.alert('Parabéns! 🎉', 'Seu pagamento foi confirmado e você agora é VILO Pro!');
    };

    const handleCheckoutCancel = () => {
        setCheckoutUrl(null);
        setSelectedPlanId(null);
    };

    return (
        <View className="flex-1 bg-background-light dark:bg-background-dark">
            <ScrollView className="flex-1 p-lg" contentContainerStyle={{ paddingBottom: 40 }}>
                <Text className="text-3xl font-inter-bold text-text-dark dark:text-text-light mt-xl mb-xs">
                    Assinatura
                </Text>
                <Text className="text-base font-inter text-gray-500 dark:text-gray-400 mb-sm">
                    Escolha o melhor plano para escalar sua criação de conteúdo.
                </Text>

                {/* 🔒 Security & no-payment badge */}
                <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-md py-sm mb-xl border border-emerald-200 dark:border-emerald-800 gap-x-2">
                    <FontAwesome name="lock" size={14} color="#10B981" />
                    <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-inter-semibold">
                        Pagamento 100% seguro · Nenhuma cobrança no período de teste
                    </Text>
                </View>

                {loadingPlans ? (
                    <View className="py-2xl">
                        <ActivityIndicator size="large" color="#3975F9" />
                    </View>
                ) : (
                    plans?.map((plan: PlanData) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            isSelected={selectedPlanId === plan.id}
                            isLoading={creatingCheckout && selectedPlanId === plan.id}
                            onSelect={() => handleSelectPlan(plan.id)}
                        />
                    ))
                )}
            </ScrollView>

            {/* Stripe WebView segura */}
            <CheckoutWebView
                checkoutUrl={checkoutUrl}
                isVisible={!!checkoutUrl}
                onSuccess={handleCheckoutSuccess}
                onCancel={handleCheckoutCancel}
            />
        </View>
    );
}
