import { STRIPE_URLS } from '../config/stripe';
import api from '../lib/api';

export interface PlanData {
    id: string;
    name: string;
    price: number;
    features: string[];
    popular?: boolean;
    savingsPercent?: number;
    trialDays?: number;
}

export const FALLBACK_PLANS: PlanData[] = [
    {
        id: 'price_123_free',
        name: 'Gratuito',
        price: 0,
        features: ['Até 3 vídeos/mês', 'Resolução 720p', 'Marca d\'água VILO'],
        trialDays: undefined,
    },
    {
        id: 'price_456_pro_monthly',
        name: 'Pro Mensal',
        price: 29.90,
        features: ['Vídeos ilimitados', 'Resolução 4K', 'Sem marca d\'água', 'Scripts com IA'],
        trialDays: 3,
    },
    {
        id: 'price_789_pro_annual',
        name: 'Pro Anual',
        price: 299.90,
        features: ['Tudo do Pro', '2 meses grátis', 'Suporte Prioritário'],
        popular: true,
        savingsPercent: 58,
    },
];

export const createCheckoutSession = async (
    planId: string,
    email: string,
    successUrl?: string,
    cancelUrl?: string
) => {
    try {
        const response = await api.post('/subscriptions/create-checkout-session', {
            planId,
            email,
            successUrl: successUrl || STRIPE_URLS.successUrl,
            cancelUrl: cancelUrl || STRIPE_URLS.cancelUrl,
        });

        return response.data; // Expected { checkoutUrl: string }
    } catch (error) {
        console.error('Erro ao criar sessão de checkout:', error);
        throw error;
    }
};

export const getPlans = async (): Promise<PlanData[]> => {
    try {
        const response = await api.get('/subscriptions/plans');
        // O backend retorna: { success: true, data: [...] }
        return response.data?.data || response.data;
    } catch (error: any) {
        console.warn('Backend route for plans might fail. Returning fallback plans.', error.message);
        return FALLBACK_PLANS;
    }
};
