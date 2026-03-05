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
        <View className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-5 transition-transform duration-300 active:scale-[0.98]">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                    <Text className="text-xl font-inter-bold text-white tracking-tight" numberOfLines={1}>{title}</Text>
                    <Text className="text-sm font-inter-medium text-text-secondary mt-1">{new Date(createdAt).toLocaleDateString()}</Text>
                </View>
            </View>

            <Text className="text-base font-inter text-text-secondary mb-5 leading-relaxed" numberOfLines={2}>
                {excerpt || 'Sem conteúdo'}
            </Text>

            <View className="flex-row justify-end items-center pt-5 border-t border-white/5 gap-3">
                {onEdit && (
                    <TouchableOpacity onPress={onEdit} className="w-10 h-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors">
                        <FontAwesome name="pencil" size={16} color="#A1A1AA" />
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity onPress={onDelete} className="w-10 h-10 items-center justify-center rounded-full bg-error/10 active:bg-error/20 transition-colors">
                        <FontAwesome name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                )}
                {onRecord && (
                    <TouchableOpacity onPress={onRecord} className="px-5 py-3 flex-row items-center bg-primary rounded-full shadow-lg shadow-primary/20 active:opacity-80 transition-all ml-1">
                        <FontAwesome name="video-camera" size={14} color="#FFFFFF" />
                        <Text className="ml-2 text-white font-inter-bold text-sm">Gravar Agora</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
