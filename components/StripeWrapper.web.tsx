import React from 'react';

export function StripeWrapper({ children }: { children: React.ReactNode }) {
    // Return the children directly without StripeProvider for the web environment
    return <>{children}</>;
}
