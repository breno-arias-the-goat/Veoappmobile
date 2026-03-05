import { View, Text, Image, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface VideoCardProps {
    title: string;
    duration: number; // in seconds
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    thumbnailUrl?: string;
    onPress?: () => void;
}

export function VideoCard({ title, duration, status, thumbnailUrl, onPress }: VideoCardProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'COMPLETED': return 'text-success';
            case 'PROCESSING': return 'text-primary';
            case 'FAILED': return 'text-error';
            default: return 'text-secondary';
        }
    };

    const getStatusBgColor = () => {
        switch (status) {
            case 'COMPLETED': return 'bg-success';
            case 'PROCESSING': return 'bg-primary';
            case 'FAILED': return 'bg-error';
            default: return 'bg-secondary';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'COMPLETED': return 'Pronto';
            case 'PROCESSING': return 'Processando';
            case 'FAILED': return 'Falhou';
            default: return 'Pendente';
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    console.log("🔥 NativeWind HMR Forced Update: VideoCard Rendered");

    return (
        <TouchableOpacity
            className="bg-white/5 border border-white/10 rounded-3xl mb-5 overflow-hidden flex-row active:scale-[0.98] transition-transform duration-300"
            activeOpacity={0.9}
            onPress={onPress}
        >
            <View className="w-1/3 aspect-video bg-[#0A0A0C] justify-center items-center">
                {thumbnailUrl ? (
                    <Image source={{ uri: thumbnailUrl }} className="w-full h-full opacity-90" resizeMode="cover" />
                ) : (
                    <FontAwesome name="play-circle-o" size={28} color="#A1A1AA" />
                )}
                {(status === 'COMPLETED' || duration > 0) && (
                    <View className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded-md backdrop-blur-md">
                        <Text className="text-white text-xs font-inter-semibold tracking-wider">{formatDuration(duration)}</Text>
                    </View>
                )}
            </View>

            <View className="flex-1 p-5 justify-between">
                <Text className="text-lg font-inter-bold text-white tracking-tight leading-snug" numberOfLines={2}>
                    {title}
                </Text>

                <View className="flex-row items-center mt-3 bg-white/5 self-start px-3 py-1.5 rounded-full border border-white/5">
                    <View className={`w-2 h-2 rounded-full mr-2 ${getStatusBgColor()}`} />
                    <Text className={`text-xs font-inter-bold tracking-wide uppercase ${getStatusColor()}`}>
                        {getStatusText()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
