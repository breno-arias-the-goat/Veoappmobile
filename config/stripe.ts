export const STRIPE_CONFIG = {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx',
};

export const STRIPE_URLS = {
    // Estas URLs serão interceptadas pelo nosso WebView
    successUrl: 'https://vilo.app/payment/success',
    cancelUrl: 'https://vilo.app/payment/cancel',
};
