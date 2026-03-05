import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG } from '../config/stripe';

export function StripeWrapper({ children }: { children: React.ReactNode }) {
    return (
        <StripeProvider publishableKey={STRIPE_CONFIG.publishableKey}>
            {children}
        </StripeProvider>
    );
}
