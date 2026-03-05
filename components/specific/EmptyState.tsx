import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '../base/Button';
import { useRouter } from 'expo-router';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: keyof typeof FontAwesome.glyphMap;
    buttonTitle?: string;
    onButtonPress?: () => void;
    actionRoute?: string;
}

export function EmptyState({
    title,
    description,
    icon = 'inbox',
    buttonTitle,
    onButtonPress,
    actionRoute
}: EmptyStateProps) {
    const router = useRouter();

    const handlePress = () => {
        if (onButtonPress) onButtonPress();
        if (actionRoute) router.push(actionRoute as any);
    };

    return (
        <View className="flex-1 justify-center items-center p-8 py-12">
            <View className="w-24 h-24 rounded-full bg-white/5 border border-white/10 shadow-xl shadow-black/20 items-center justify-center mb-6">
                <FontAwesome name={icon} size={42} color="#5E2BFF" />
            </View>
            <Text className="text-2xl font-inter-bold text-white mb-3 text-center tracking-tight">
                {title}
            </Text>
            <Text className="text-base font-inter-medium text-text-secondary text-center mb-10 leading-relaxed px-4">
                {description}
            </Text>

            {(buttonTitle && (onButtonPress || actionRoute)) && (
                <Button
                    title={buttonTitle}
                    onPress={handlePress}
                    className="w-full max-w-[280px]"
                />
            )}
        </View>
    );
}
