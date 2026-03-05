import { useMutation, useQuery } from '@tanstack/react-query';
import { createCheckoutSession, getPlans } from '../services/subscriptionService';

export const usePlans = () => {
    return useQuery({
        queryKey: ['subscriptionPlans'],
        queryFn: getPlans,
    });
};

export const useStripeCheckout = () => {
    return useMutation({
        mutationFn: ({
            planId,
            email,
            successUrl,
            cancelUrl,
        }: {
            planId: string;
            email: string;
            successUrl?: string;
            cancelUrl?: string;
        }) => createCheckoutSession(planId, email, successUrl, cancelUrl),
        onError: (error) => {
            console.error('Erro na mutação de checkout:', error);
        },
    });
};
