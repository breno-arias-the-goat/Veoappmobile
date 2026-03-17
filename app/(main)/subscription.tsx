import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckoutWebView } from '../../components/specific/CheckoutWebView';
import { PlanCard } from '../../components/specific/PlanCard';
import { useAuth } from '../../contexts/AuthContext';
import { usePlans, useStripeCheckout } from '../../hooks/useSubscription';
import type { PlanData } from '../../services/subscriptionService';

export default function SubscriptionScreen() {
    const router = useRouter();
    const { isPro, subscriptionPlan, credits, userEmail, refreshSubscriptionStatus } = useAuth();
    const { data: plans, isLoading: loadingPlans } = usePlans();
    const { mutate: createCheckout, isPending: creatingCheckout } = useStripeCheckout();

    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    const handleSelectPlan = (planId: string) => {
        if (planId.includes('free')) {
            Alert.alert('Plano Atual', 'Você já está no plano gratuito.');
            return;
        }

        if (!userEmail) {
            Alert.alert(
                'Conta Necessária',
                'Faça login ou crie uma conta para assinar o Vilo Pro e não perder seu acesso.',
            );
            return;
        }

        setSelectedPlanId(planId);

        const email = userEmail;

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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 16 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <FontAwesome name="chevron-left" size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Minha Assinatura</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                    <Text style={{ color: '#A1A1AA', fontSize: 12, marginBottom: 4 }}>Plano Atual</Text>
                    <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
                        {isPro ? `PRO ✦ (${subscriptionPlan || 'Ativo'})` : 'Gratuito'}
                    </Text>
                    <Text style={{ color: '#FFD93D', fontSize: 16, fontWeight: '700', marginTop: 8 }}>
                        {credits} créditos restantes
                    </Text>
                </View>

                {/* Lista de Planos do Stripe */}
                <Text className="text-xl font-inter-bold text-white mb-4">Escolha um Plano</Text>
                {loadingPlans ? (
                    <View className="py-8">
                        <ActivityIndicator size="large" color="#5E2BFF" />
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

            <CheckoutWebView
                checkoutUrl={checkoutUrl}
                isVisible={!!checkoutUrl}
                onSuccess={handleCheckoutSuccess}
                onCancel={handleCheckoutCancel}
            />
        </SafeAreaView>
    );
}
