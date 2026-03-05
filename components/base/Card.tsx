import { View, Text } from 'react-native';


export function Card({ title, children, className = '' }: any) {
    console.log("🔥 NativeWind HMR Forced Update: Card Base Rendered");
    return (
        <View className={`bg-white/5 p-6 rounded-3xl border border-white/10 ${className}`}>
            {title && <Text className="text-xl font-inter-bold text-white mb-4 tracking-tight">{title}</Text>}
            {children}
        </View>
    );
}
