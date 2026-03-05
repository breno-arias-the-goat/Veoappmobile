import { Stack } from 'expo-router';

export default function MainLayout() {
    return (
        <Stack>
            <Stack.Screen name="preview" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
    );
}
