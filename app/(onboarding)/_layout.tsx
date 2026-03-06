import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack screenOptions={{ headerBackTitle: 'Voltar' }}>
            <Stack.Screen name="[step]" options={{ headerShown: false }} />
        </Stack>
    );
}
