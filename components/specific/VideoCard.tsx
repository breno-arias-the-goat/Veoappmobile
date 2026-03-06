import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface VideoCardProps {
    title: string;
    duration: number; // in seconds
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    thumbnailUrl?: string;
    onPress?: () => void;
    onLongPress?: () => void;
}

export function VideoCard({ title, duration, status, thumbnailUrl, onPress, onLongPress }: VideoCardProps) {
    const getStatusColor = () => {
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

    return (
        <TouchableOpacity
            className="w-[160px] aspect-[9/16] bg-[#121214] border border-white/5 rounded-3xl mr-4 overflow-hidden active:scale-[0.96] transition-transform duration-300 shadow-xl shadow-black/50"
            activeOpacity={0.9}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            {thumbnailUrl ? (
                <Image source={{ uri: thumbnailUrl }} className="absolute w-full h-full opacity-95" resizeMode="cover" />
            ) : (
                <View className="absolute w-full h-full justify-center items-center bg-[#1A1A1D]">
                    <FontAwesome name="play-circle" size={36} color="#4A4A55" />
                </View>
            )}

            {/* Gradient Overlay for Text Readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                className="absolute bottom-0 w-full h-1/2 justify-end p-4"
            >
                <View className="flex-col justify-end">
                    <Text className="text-[15px] font-inter-bold text-white tracking-tight leading-tight mb-2" numberOfLines={2}>
                        {title}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        {(status === 'COMPLETED' || duration > 0) && (
                            <View className="bg-black/60 px-2 py-1 rounded border border-white/10 backdrop-blur-md">
                                <Text className="text-white/90 text-[10px] font-inter-semibold tracking-wide">
                                    {formatDuration(duration)}
                                </Text>
                            </View>
                        )}
                        <View className="flex-row items-center bg-black/60 px-2 py-1 rounded-full border border-white/10 backdrop-blur-md">
                            <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusColor()}`} />
                            <Text className="text-white text-[9px] font-inter-bold tracking-wider uppercase">
                                {getStatusText()}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {status === 'PROCESSING' && (
                <View className="absolute top-3 left-3 bg-primary/20 border border-primary/50 px-2 py-1 rounded-full backdrop-blur-md">
                    <Text className="text-primary text-[10px] font-inter-bold uppercase tracking-wider">Processando...</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
