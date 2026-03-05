import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { VideoPlayer } from '../../components/specific/VideoPlayer';
import { Button } from '../../components/base/Button';
import { useSubtitles, Subtitle } from '../../hooks/useSubtitles';
import api from '../../lib/api';

export default function CaptionEditorScreen() {
    const { videoUri, videoId } = useLocalSearchParams();
    const router = useRouter();

    const { subtitlesQuery, generateMutation, updateMutation, checkJobStatus } = useSubtitles(videoId as string);

    const [activeTab, setActiveTab] = useState<'text' | 'style'>('text');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const [styleConfig, setStyleConfig] = useState<{ fontSize: number, color: string, backgroundColor: string, position: 'top' | 'middle' | 'bottom' }>({
        fontSize: 24,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'bottom'
    });

    // Editor Inline
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const subtitles: Subtitle[] = subtitlesQuery.data || [];

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            setProgress(0);
            const { jobId } = await generateMutation.mutateAsync({ language: 'pt-BR' });

            // Start polling
            const poll = setInterval(async () => {
                try {
                    const statusData = await checkJobStatus(jobId);
                    if (statusData) {
                        setProgress(statusData.progress);
                        if (statusData.status === 'completed') {
                            clearInterval(poll);
                            setIsGenerating(false);
                            subtitlesQuery.refetch();
                            Alert.alert("Sucesso", "A Inteligência Artificial terminou de escutar e legendar seu vídeo!");
                        } else if (statusData.status === 'failed') {
                            clearInterval(poll);
                            setIsGenerating(false);
                            Alert.alert("Erro", "Falha ao processar legendas com A.I.");
                        }
                    }
                } catch (e) {
                    clearInterval(poll);
                    setIsGenerating(false);
                }
            }, 3000); // 3 seconds pooling
        } catch (error: any) {
            setIsGenerating(false);
            const errorMsg = error?.response?.data?.message || error?.message || "Erro desconhecido.";
            console.error("GENERATE AI ERROR:", error?.response?.data || error);
            Alert.alert("Erro na I.A", `O servidor recusou a geração:\n\n${errorMsg}`);
        }
    };

    const saveEdit = async (subtitleId: string) => {
        if (!editValue.trim() || !subtitleId) {
            setEditingId(null);
            return;
        }
        await updateMutation.mutateAsync({ subtitleId, text: editValue });
        setEditingId(null);
    };

    const handleApplyBurn = async () => {
        try {
            setIsGenerating(true);
            setProgress(100);

            await api.post(`/subtitles/video/${videoId}/render`, styleConfig);

            Alert.alert("Sucesso", "Renderização na Nuvem Iniciada! O seu vídeo atualizado estará na Galeria em alguns minutos.");
            router.back();

        } catch (error: any) {
            setIsGenerating(false);
            Alert.alert("Erro Técnico", "A nuvem rejeitou a ordem de compilação FFMPEG.");
        }
    };

    const formatMs = (ms: number) => {
        const total = Math.floor(ms / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!videoUri || !videoId) {
        return (
            <View className="flex-1 justify-center items-center bg-background"><Text className="text-white">Vídeo não encontrado.</Text></View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top', 'bottom']}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
                    <FontAwesome name="chevron-left" size={18} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-inter-bold flex-1">Estúdio de Legendas</Text>
                {subtitles.length > 0 && (
                    <TouchableOpacity onPress={handleApplyBurn} className="bg-primary px-3 py-1.5 rounded-full">
                        <Text className="text-white font-inter-bold text-xs">Exportar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Video Preview (Half Screen) */}
            <View className="w-full aspect-[9/16] max-h-[40vh] bg-black">
                <VideoPlayer
                    videoUri={videoUri as string}
                    subtitles={subtitles}
                    subtitleStyle={styleConfig}
                />
            </View>

            {/* Editor Area */}
            <View className="flex-1 bg-surface">
                {subtitlesQuery.isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#primary" size="large" />
                    </View>
                ) : subtitles.length === 0 ? (
                    /* Empty State - Needs Generation */
                    <View className="flex-1 justify-center items-center p-6">
                        <FontAwesome name="magic" size={48} color="#A1A1AA" className="mb-4" />
                        <Text className="text-white text-xl font-inter-bold mb-2">Sem Legendas</Text>
                        <Text className="text-secondary text-center mb-8">
                            A Inteligência Artificial (Whisper) pode ouvir e transcrever automaticamente o seu vídeo.
                        </Text>

                        {isGenerating ? (
                            <View className="w-full items-center">
                                <ActivityIndicator color="#4C24A0" size="large" className="mb-4" />
                                <Text className="text-primary font-inter-bold mb-2">Mágica em Andamento ({progress}%)</Text>
                                <View className="w-full h-2 bg-borderSolid rounded-full overflow-hidden">
                                    <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
                                </View>
                            </View>
                        ) : (
                            <Button title="✨ Gerar Automaticamente" onPress={handleGenerate} className="w-full" variant="primary" />
                        )}
                    </View>
                ) : (
                    /* Editor Controls */
                    <View className="flex-1">
                        {/* Tabs */}
                        <View className="flex-row border-b border-border">
                            <TouchableOpacity
                                className={`flex-1 py-4 items-center ${activeTab === 'text' ? 'border-b-2 border-primary' : ''}`}
                                onPress={() => setActiveTab('text')}
                            >
                                <Text className={`font-inter-bold ${activeTab === 'text' ? 'text-primary' : 'text-secondary'}`}>Transcrição (Texto)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-4 items-center ${activeTab === 'style' ? 'border-b-2 border-primary' : ''}`}
                                onPress={() => setActiveTab('style')}
                            >
                                <Text className={`font-inter-bold ${activeTab === 'style' ? 'text-primary' : 'text-secondary'}`}>Estilo Visual</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        {activeTab === 'text' ? (
                            <FlatList
                                data={subtitles}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ padding: 16 }}
                                renderItem={({ item }) => (
                                    <View className="mb-3 bg-background p-3 rounded-lg border border-borderSolid">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="text-xs text-secondary font-inter">
                                                {formatMs(item.startTimeMs)} - {formatMs(item.endTimeMs)}
                                            </Text>
                                            {editingId === item.id ? (
                                                <TouchableOpacity onPress={() => saveEdit(item.id)}>
                                                    <Text className="text-primary font-inter-bold text-xs">Salvar</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity onPress={() => { setEditingId(item.id); setEditValue(item.text); }}>
                                                    <FontAwesome name="edit" size={14} color="#A1A1AA" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {editingId === item.id ? (
                                            <TextInput
                                                className="text-white font-inter bg-[#0f0f13] p-2 rounded text-base border border-primary"
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                multiline
                                                autoFocus
                                            />
                                        ) : (
                                            <Text className="text-white font-inter text-base">{item.text}</Text>
                                        )}
                                    </View>
                                )}
                            />
                        ) : (
                            <ScrollView contentContainerStyle={{ padding: 20 }}>
                                <Text className="text-sm text-secondary font-inter-semibold mb-3 uppercase tracking-wider">Tamanho da Fonte</Text>
                                <View className="flex-row gap-3 mb-8">
                                    {[16, 20, 24, 28, 32].map(size => (
                                        <TouchableOpacity
                                            key={size}
                                            onPress={() => setStyleConfig({ ...styleConfig, fontSize: size })}
                                            className={`w-12 h-12 rounded-full items-center justify-center border ${styleConfig.fontSize === size ? 'border-primary bg-primary/20' : 'border-borderSolid bg-background'}`}
                                        >
                                            <Text className="text-white font-inter-bold">{size}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text className="text-sm text-secondary font-inter-semibold mb-3 uppercase tracking-wider">Cor do Texto</Text>
                                <View className="flex-row gap-3 mb-8">
                                    {['#FFFFFF', '#FFD700', '#00FF00', '#FF3366', '#00FFFF'].map(color => (
                                        <TouchableOpacity
                                            key={color}
                                            onPress={() => setStyleConfig({ ...styleConfig, color })}
                                            className={`w-10 h-10 rounded-full border-2 ${styleConfig.color === color ? 'border-primary' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </View>

                                <Text className="text-sm text-secondary font-inter-semibold mb-3 uppercase tracking-wider">Posição no Vídeo</Text>
                                <View className="flex-row gap-3">
                                    {(['top', 'middle', 'bottom'] as const).map(pos => (
                                        <TouchableOpacity
                                            key={pos}
                                            onPress={() => setStyleConfig({ ...styleConfig, position: pos })}
                                            className={`flex-1 py-3 rounded-lg border items-center ${styleConfig.position === pos ? 'border-primary bg-primary/20' : 'border-borderSolid bg-background'}`}
                                        >
                                            <Text className="text-white font-inter-bold capitalize">{pos}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
