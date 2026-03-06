import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, TouchableOpacity, View } from 'react-native';

interface ScriptCardProps {
    title: string;
    excerpt: string;
    createdAt: string;
    onEdit?: () => void;
    onRecord?: () => void;
    onDelete?: () => void;
}

export function ScriptCard({ title, excerpt, createdAt, onEdit, onRecord, onDelete }: ScriptCardProps) {
    return (
        <View className="w-[280px] bg-[#121214] border border-white/5 p-5 rounded-3xl mr-4 transition-transform duration-300 active:scale-[0.98] shadow-lg shadow-black/30 flex-col justify-between">
            <View>
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-3">
                        <Text className="text-lg font-inter-bold text-white tracking-tight" numberOfLines={1}>{title}</Text>
                        <Text className="text-xs font-inter-medium text-text-secondary mt-1">{new Date(createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                <Text className="text-[13px] font-inter text-text-secondary mb-4 leading-relaxed" numberOfLines={2}>
                    {excerpt || 'Sem conteúdo'}
                </Text>
            </View>

            <View className="flex-row justify-end items-center pt-4 border-t border-white/5 gap-2 mt-auto">
                <View className="flex-row gap-2 flex-1">
                    {onEdit && (
                        <TouchableOpacity onPress={onEdit} className="w-9 h-9 items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors">
                            <FontAwesome name="pencil" size={14} color="#A1A1AA" />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity onPress={onDelete} className="w-9 h-9 items-center justify-center rounded-full bg-error/10 active:bg-error/20 transition-colors">
                            <FontAwesome name="trash" size={14} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>

                {onRecord && (
                    <TouchableOpacity onPress={onRecord} className="px-5 py-2.5 flex-row items-center bg-primary rounded-full shadow-lg shadow-primary/20 active:opacity-80 transition-all">
                        <FontAwesome name="video-camera" size={12} color="#FFFFFF" />
                        <Text className="ml-1.5 text-white font-inter-bold text-[13px]">Gravar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
