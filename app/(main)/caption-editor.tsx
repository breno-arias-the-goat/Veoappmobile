import React, { useState } from 'react';
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

    const [styleConfig, setStyleConfig] = useState<{ fontSize: number, color: string, backgroundColor: string, position: 'top' | 'middle' | 'bottom', positionX?: number, positionY?: number, fontFamily?: string }>({
        fontSize: 24,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'middle',
        fontFamily: 'Inter-Black',
        positionX: 0.5,
        positionY: 0.8
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const subtitles: Subtitle[] = subtitlesQuery.data || [];

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            setProgress(0);
            const { jobId } = await generateMutation.mutateAsync({ language: 'pt-BR' });

            const poll = setInterval(async () => {
                try {
                    const statusData = await checkJobStatus(jobId);
                    if (statusData) {
                        setProgress(statusData.progress);
                        if (statusData.status === 'completed') {
                            clearInterval(poll);
                            setIsGenerating(false);
                            subtitlesQuery.refetch();
                            Alert.alert("Sucesso", "A Inteligência Artificial terminou de transcrever seu vídeo!");
                        } else if (statusData.status === 'failed') {
                            clearInterval(poll);
                            setIsGenerating(false);
                            Alert.alert("Erro", "Falha ao processar legendas com A.I.");
                        }
                    }
                } catch (e: any) {
                    clearInterval(poll);
                    setIsGenerating(false);
                    Alert.alert("Erro", "Falha de comunicação com o servidor.");
                }
            }, 3000);
        } catch (error: any) {
            setIsGenerating(false);
            Alert.alert("Erro", "O servidor recusou a geração.");
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
            setIsGenerating(false);
            Alert.alert("Sucesso", "Renderização na Nuvem Iniciada! Seu vídeo aparecerá na Galeria em alguns minutos.");
            router.replace('/(tabs)/subtitles');
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
        return <View className="flex-1 justify-center items-center bg-[#09090B]"><Text className="text-white">Vídeo não encontrado.</Text></View>;
    }

    return (
        <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top', 'bottom']}>
            {/* Minimal Header */}
            <View className="flex-row items-center px-4 py-2 border-b border-white/10 z-10">
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/subtitles')} className="mr-3 p-2">
                    <FontAwesome name="times" size={20} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-base font-inter-semibold flex-1 text-center">Edição Automática</Text>

                {/* Export CTA on Top Right for quicker access like CapCut */}
                {!subtitlesQuery.isLoading && subtitles.length > 0 && !isGenerating && (
                    <TouchableOpacity onPress={handleApplyBurn} className="bg-primary px-4 py-1.5 rounded-full">
                        <Text className="text-white font-inter-bold text-sm">Exportar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Video Preview (Flex 1 - Takes Maximum Space) */}
            <View className="flex-1 bg-black relative justify-center items-center">
                <View className="w-full h-full relative">
                    <VideoPlayer
                        videoUri={videoUri as string}
                        subtitles={subtitles}
                        subtitleStyle={styleConfig}
                        onSubtitlePositionChange={(x, y) => setStyleConfig({ ...styleConfig, positionX: x, positionY: y })}
                    />
                </View>

                {isGenerating && (
                    <View className="absolute inset-0 bg-black/60 justify-center items-center z-50">
                        <ActivityIndicator color="#5E2BFF" size="large" className="mb-4" />
                        <Text className="text-white font-inter-bold text-lg mb-2">Processando na Nuvem</Text>
                        <Text className="text-white/70 font-inter mb-4 text-center px-6">Por favor, aguarde enquanto a mágica acontece. ({progress}%)</Text>
                        <View className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
                        </View>
                    </View>
                )}
            </View>

            {/* Bottom Sheet Tools Area */}
            <View className="h-[280px] bg-[#18181B] rounded-t-2xl shadow-lg border-t border-white/5 pb-2">
                {subtitlesQuery.isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator color="#5E2BFF" size="large" />
                    </View>
                ) : subtitles.length === 0 ? (
                    <View className="flex-1 justify-center items-center px-6">
                        <FontAwesome name="magic" size={32} color="#5E2BFF" className="mb-3" />
                        <Text className="text-white text-lg font-inter-bold mb-1">Legendas I.A</Text>
                        <Text className="text-zinc-400 text-center mb-5 text-sm">Gere legendas dinâmicas perfeitamente sincronizadas com a sua voz.</Text>
                        <Button title="Começar Auto Legenda" onPress={handleGenerate} className="w-full" variant="primary" />
                    </View>
                ) : (
                    <View className="flex-1 pt-2">
                        {/* Compact Tabs */}
                        <View className="flex-row justify-center gap-6 border-b border-white/5 pb-2 px-4">
                            <TouchableOpacity
                                className={`pb-2 ${activeTab === 'style' ? 'border-b-2 border-primary' : ''}`}
                                onPress={() => setActiveTab('style')}
                            >
                                <Text className={`font-inter-semibold text-sm ${activeTab === 'style' ? 'text-white' : 'text-zinc-500'}`}>Estilos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`pb-2 ${activeTab === 'text' ? 'border-b-2 border-primary' : ''}`}
                                onPress={() => setActiveTab('text')}
                            >
                                <Text className={`font-inter-semibold text-sm ${activeTab === 'text' ? 'text-white' : 'text-zinc-500'}`}>Transcrições</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        {activeTab === 'text' ? (
                            <FlatList
                                data={subtitles}
                                keyExtractor={item => item.id}
                                contentContainerStyle={{ padding: 12 }}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => (
                                    <View className="mb-2 bg-[#27272A] p-3 rounded-xl border border-white/5">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="text-xs text-primary font-inter-semibold">
                                                {formatMs(item.startTimeMs)} - {formatMs(item.endTimeMs)}
                                            </Text>
                                            {editingId === item.id ? (
                                                <TouchableOpacity onPress={() => saveEdit(item.id)} className="bg-primary/20 px-2 py-0.5 rounded">
                                                    <Text className="text-primary font-inter-bold text-xs">Salvar</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity onPress={() => { setEditingId(item.id); setEditValue(item.text); }}>
                                                    <FontAwesome name="pencil" size={12} color="#A1A1AA" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        {editingId === item.id ? (
                                            <TextInput
                                                className="text-white font-inter bg-black/40 p-2 rounded-lg text-sm border border-primary/50 mt-1"
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                multiline
                                                autoFocus
                                            />
                                        ) : (
                                            <Text className="text-white font-inter text-sm pt-1">{item.text}</Text>
                                        )}
                                    </View>
                                )}
                            />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                                {/* Horizontal Carousels for Styles like CapCut */}

                                {/* FONTS */}
                                <View className="mt-4 px-4">
                                    <View className="flex-row items-center mb-2">
                                        <Text className="text-xs text-zinc-400 font-inter-semibold uppercase tracking-wider flex-1">Tipografia</Text>
                                    </View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1">
                                        {[
                                            { id: 'Inter-Regular', label: 'Classic' },
                                            { id: 'Inter-Bold', label: 'Pro Bold' },
                                            { id: 'Inter-Black', label: 'Heavy' },
                                            // Mocking more items to show scroll
                                            { id: 'Inter-Regular2', label: 'Modern' },
                                            { id: 'Inter-Bold2', label: 'Title' }
                                        ].map(font => (
                                            <TouchableOpacity
                                                key={font.id}
                                                onPress={() => setStyleConfig({ ...styleConfig, fontFamily: font.id.replace('2', '') })}
                                                className={`mr-3 px-4 py-2 border rounded-full ${styleConfig.fontFamily === font.id.replace('2', '') ? 'border-primary bg-primary/10' : 'border-white/10 bg-[#27272A]'}`}
                                            >
                                                <Text className={`text-white text-sm ${font.id.includes('Bold') ? 'font-inter-bold' : font.id.includes('Black') ? 'font-inter-black' : 'font-inter'}`}>{font.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* SIZES */}
                                <View className="mt-6 px-4">
                                    <View className="flex-row items-center mb-2">
                                        <Text className="text-xs text-zinc-400 font-inter-semibold uppercase tracking-wider flex-1">Tamanho</Text>
                                    </View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1">
                                        {[14, 18, 24, 28, 32, 38, 44].map(size => (
                                            <TouchableOpacity
                                                key={size}
                                                onPress={() => setStyleConfig({ ...styleConfig, fontSize: size })}
                                                className={`mr-3 w-10 h-10 rounded-full items-center justify-center border ${styleConfig.fontSize === size ? 'border-primary bg-primary/20' : 'border-white/10 bg-[#27272A]'}`}
                                            >
                                                <Text className="text-white font-inter-bold text-sm">{size}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* COLORS */}
                                <View className="mt-6 px-4 mb-6">
                                    <View className="flex-row items-center mb-2">
                                        <Text className="text-xs text-zinc-400 font-inter-semibold uppercase tracking-wider flex-1">Cores</Text>
                                    </View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1 py-1">
                                        {['#FFFFFF', '#000000', '#FFD700', '#FF3366', '#00FFFF', '#00FF00', '#FF9900', '#9933FF', '#FF0000', '#0000FF'].map(color => (
                                            <TouchableOpacity
                                                key={color}
                                                onPress={() => setStyleConfig({ ...styleConfig, color })}
                                                className={`mr-4 w-9 h-9 rounded-full shadow-sm border-2 ${styleConfig.color === color ? 'border-primary scale-110' : 'border-white/20'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </ScrollView>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
