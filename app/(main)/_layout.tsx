import { Stack } from 'expo-router';

export default function MainLayout() {
    return (
        <Stack screenOptions={{ headerBackTitle: 'Voltar' }}>
            <Stack.Screen name="preview" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="caption-editor" options={{ headerShown: false }} />
            <Stack.Screen name="subscription" options={{ headerShown: false }} />
        </Stack>
    );
}
