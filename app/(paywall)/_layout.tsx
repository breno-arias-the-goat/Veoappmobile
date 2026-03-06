import { Stack } from 'expo-router';

export default function PaywallLayout() {
    return (
        <Stack screenOptions={{ headerBackTitle: 'Voltar' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    );
}
