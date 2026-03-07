import React, { ReactElement } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG } from '../config/stripe';

interface Props {
    children: ReactElement | ReactElement[];
}

export function StripeWrapper({ children }: Props) {
    return (
        <StripeProvider publishableKey={STRIPE_CONFIG.publishableKey}>
            {children}
        </StripeProvider>
    );
}
