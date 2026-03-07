import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { VideoPlayer } from '../../components/specific/VideoPlayer';
import { Button } from '../../components/base/Button';
import { useSubtitles, Subtitle } from '../../hooks/useSubtitles';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CaptionEditorScreen() {
    const { videoUri, videoId } = useLocalSearchParams();
    const router = useRouter();

    const { subtitlesQuery, generateMutation, updateMutation, checkJobStatus } = useSubtitles(videoId as string);

    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const [styleConfig, setStyleConfig] = useState<{ fontSize: number, color: string, backgroundColor: string, position: 'top' | 'middle' | 'bottom', positionX?: number, positionY?: number, fontFamily?: string }>({
        fontSize: 32,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.0)', // Transparent by default for modern look
        position: 'middle',
        fontFamily: 'Inter-Black',
        positionX: 0.5,
        positionY: 0.75
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
                        setProgress(statusData.progress || 0);
                        if (statusData.status === 'completed') {
                            clearInterval(poll);
                            setIsGenerating(false);
                            subtitlesQuery.refetch();
                        } else if (statusData.status === 'failed') {
                            clearInterval(poll);
                            setIsGenerating(false);
                            Alert.alert("Aviso Exclusivo Jarvis", `Falha detectada na transcrição I.A. Motivo interno: ${statusData.errorMessage || 'Falha de compilação FFmpeg ou timeout de API'}`);
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
            Alert.alert("Erro", "O servidor recusou a requisição de geração. Verifique os logs Node.js.");
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
            Alert.alert("Renderização Iniciada", "Seu vídeo está sendo processado na Nuvem. Ele aparecerá pronto na sua Galeria em breve.");
            router.replace('/(tabs)/subtitles');
        } catch (error: any) {
            setIsGenerating(false);
            Alert.alert("Erro Técnico", "Falha ao enviar parâmetros de renderização para a nuvem.");
        }
    };

    const formatMs = (ms: number) => {
        const total = Math.floor(ms / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Update state to allow null so we can hide the sheet to view video
    const [activeTab, setActiveTab] = useState<'text' | 'style' | null>('style'); // Default to style open slightly or null

    if (!videoUri || !videoId) {
        return <View className="flex-1 justify-center items-center bg-[#000000]"><Text className="text-white">Vídeo não encontrado.</Text></View>;
    }

    // Tools Pill Bar - Modern approach
    const FloatingToolbar = () => (
        <View className="absolute bottom-10 left-0 right-0 items-center px-4 z-50">
            <View className="flex-row items-center bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl">
                <TouchableOpacity
                    onPress={() => setActiveTab(activeTab === 'text' ? null : 'text')}
                    className={`px-5 py-3 rounded-full mr-1 transition-all flex-row items-center ${activeTab === 'text' ? 'bg-primary' : ''}`}
                >
                    <FontAwesome name="align-left" size={12} color="white" className="mr-2" />
                    <Text className="text-white font-inter-semibold text-sm">Textos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab(activeTab === 'style' ? null : 'style')}
                    className={`px-5 py-3 rounded-full mr-1 transition-all flex-row items-center ${activeTab === 'style' ? 'bg-primary' : ''}`}
                >
                    <FontAwesome name="paint-brush" size={12} color="white" className="mr-2" />
                    <Text className="text-white font-inter-semibold text-sm">Estilos</Text>
                </TouchableOpacity>

                {subtitles.length === 0 && !subtitlesQuery.isLoading && (
                    <TouchableOpacity
                        onPress={handleGenerate}
                        className="px-5 py-3 rounded-full bg-[#5E2BFF]/30 border border-[#5E2BFF]/50 transition-all flex-row items-center ml-1"
                    >
                        <FontAwesome name="magic" size={12} color="#A78BFA" className="mr-2" />
                        <Text className="text-[#A78BFA] font-inter-bold text-sm">Auto IA</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
            <StatusBar style="light" />

            {/* Immersive Video Background */}
            <View className="absolute inset-0 z-0 bg-black items-center justify-center">
                <VideoPlayer
                    videoUri={videoUri as string}
                    subtitles={subtitles}
                    subtitleStyle={styleConfig}
                    onSubtitlePositionChange={(x, y) => setStyleConfig({ ...styleConfig, positionX: x, positionY: y })}
                />

                {/* Generation Overlay */}
                {isGenerating && (
                    <View className="absolute inset-0 bg-black/85 justify-center items-center z-[100] backdrop-blur-md">
                        <ActivityIndicator color="#5E2BFF" size="large" className="mb-6" />
                        <Text className="text-white font-inter-bold text-2xl mb-3 tracking-tight">Mágica I.A em curso</Text>
                        <Text className="text-white/60 font-inter mb-8 text-center px-10 text-base leading-relaxed">
                            Ouvindo, transcrevendo e animando suas palavras... {progress}%
                        </Text>
                        <View className="w-64 h-2 bg-white/10 rounded-full overflow-hidden shadow-lg shadow-primary/20">
                            <View className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </View>
                    </View>
                )}
            </View>

            {/* Floating Top Header */}
            <View className="absolute top-12 left-0 right-0 z-50 flex-row justify-between items-center px-5 pointer-events-box-none">
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/subtitles')}
                    className="w-11 h-11 bg-black/40 rounded-full items-center justify-center backdrop-blur-xl border border-white/5 shadow-lg"
                >
                    <FontAwesome name="chevron-left" size={16} color="white" style={{ marginLeft: -2 }} />
                </TouchableOpacity>

                {!subtitlesQuery.isLoading && subtitles.length > 0 && !isGenerating && (
                    <TouchableOpacity
                        onPress={handleApplyBurn}
                        className="bg-primary/95 backdrop-blur-md px-6 py-3 rounded-full flex-row items-center border border-white/10 shadow-lg shadow-primary/30"
                    >
                        <Text className="text-white font-inter-bold text-sm mr-2 tracking-wide uppercase">Exportar</Text>
                        <FontAwesome name="download" size={12} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Render Toolbar */}
            {!isGenerating && <FloatingToolbar />}

            {/* Sliding Bottom Sheet Overlay dynamically active */}
            {activeTab && !isGenerating && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="absolute left-0 right-0 bottom-0 z-40 bg-[#0A0A0C]/95 backdrop-blur-3xl rounded-t-[32px] border-t border-white/10 shadow-black shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                    style={{ height: SCREEN_HEIGHT * 0.45 }}
                >
                    {/* Drag Handle */}
                    <View className="w-full items-center pt-4 pb-2" onTouchStart={() => setActiveTab(null)}>
                        <View className="w-12 h-1.5 bg-white/20 rounded-full" />
                    </View>

                    {subtitlesQuery.isLoading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator color="#5E2BFF" size="large" />
                        </View>
                    ) : (
                        <View className="flex-1">
                            {activeTab === 'text' && (
                                <View className="flex-1">
                                    <View className="px-6 py-3 border-b border-white/5 flex-row justify-between items-center">
                                        <Text className="text-white font-inter-bold text-lg">Suas Palavras</Text>
                                        <Text className="text-white/40 text-xs font-inter-medium">{subtitles.length} blocos gerados</Text>
                                    </View>
                                    <FlatList
                                        data={subtitles}
                                        keyExtractor={item => item.id}
                                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                        showsVerticalScrollIndicator={false}
                                        renderItem={({ item }) => (
                                            <View className="mb-4 bg-[#18181B] p-5 rounded-[20px] border border-white/5 shadow-lg">
                                                <View className="flex-row justify-between items-center mb-3">
                                                    <Text className="text-xs text-[#A78BFA] font-inter-bold bg-[#A78BFA]/10 px-2.5 py-1 rounded-md">
                                                        {formatMs(item.startTimeMs)} - {formatMs(item.endTimeMs)}
                                                    </Text>
                                                    {editingId === item.id ? (
                                                        <TouchableOpacity onPress={() => saveEdit(item.id)} className="bg-primary/90 px-4 py-1.5 rounded-full flex-row items-center cursor-pointer shadow-sm shadow-primary/20">
                                                            <FontAwesome name="check" size={10} color="white" className="mr-1.5" />
                                                            <Text className="text-white font-inter-bold text-xs uppercase tracking-wider">Salvar</Text>
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <TouchableOpacity onPress={() => { setEditingId(item.id); setEditValue(item.text); }} className="px-3 py-1 bg-white/5 rounded-full h-8 w-8 items-center justify-center">
                                                            <FontAwesome name="pencil" size={14} color="#A1A1AA" />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                                {editingId === item.id ? (
                                                    <TextInput
                                                        className="text-white font-inter text-lg bg-black/40 p-4 rounded-xl border border-primary/50"
                                                        value={editValue}
                                                        onChangeText={setEditValue}
                                                        multiline
                                                        autoFocus
                                                        scrollEnabled
                                                    />
                                                ) : (
                                                    <Text className="text-white/95 font-inter text-[17px] leading-snug">{item.text}</Text>
                                                )}
                                            </View>
                                        )}
                                    />
                                </View>
                            )}

                            {activeTab === 'style' && (
                                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-2">
                                    {/* Font Section */}
                                    <View className="mb-7 mt-2">
                                        <View className="flex-row items-center justify-between mb-4">
                                            <Text className="text-sm text-white font-inter-bold uppercase tracking-widest pl-1">Vibes (Fontes)</Text>
                                        </View>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                                            {[
                                                { id: 'Inter-Black', label: 'Blink Bold', icon: 'align-center' },
                                                { id: 'Inter-Bold', label: 'Proxima', icon: 'font' },
                                                { id: 'Inter-Medium', label: 'Classic', icon: 'align-left' },
                                                { id: 'Arial', label: 'System', icon: 'text-height' }
                                            ].map(font => (
                                                <TouchableOpacity
                                                    key={font.id}
                                                    onPress={() => setStyleConfig({ ...styleConfig, fontFamily: font.id })}
                                                    className={`mr-3 px-6 py-4 rounded-[20px] border flex-row items-center transition-all ${styleConfig.fontFamily === font.id ? 'border-primary bg-primary/20' : 'border-white/5 bg-[#18181B]'}`}
                                                >
                                                    <FontAwesome name={font.icon as any} size={14} color={styleConfig.fontFamily === font.id ? 'white' : '#71717A'} className="mr-3" />
                                                    <Text className={`text-sm ${styleConfig.fontFamily === font.id ? 'text-white font-inter-bold' : 'text-zinc-400 font-inter'} ${font.id === 'Inter-Black' ? 'font-inter-black' : font.id === 'Inter-Bold' ? 'font-inter-bold' : ''}`}>{font.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    {/* Size Controller */}
                                    <View className="mb-7 flex-row justify-between items-center border border-white/5 bg-[#18181B] rounded-[24px] p-5">
                                        <View>
                                            <Text className="text-white font-inter-bold text-base">Impacto</Text>
                                            <Text className="text-[11px] text-zinc-500 font-inter uppercase tracking-wider mt-1">Tamanho da Letra</Text>
                                        </View>
                                        <View className="flex-row bg-black/40 rounded-full p-1 border border-white/5">
                                            {[24, 32, 40, 52].map(size => (
                                                <TouchableOpacity
                                                    key={size}
                                                    onPress={() => setStyleConfig({ ...styleConfig, fontSize: size })}
                                                    className={`w-10 h-10 rounded-full items-center justify-center transition-all ${styleConfig.fontSize === size ? 'bg-[#5E2BFF] shadow-lg shadow-primary/40' : 'bg-transparent'}`}
                                                >
                                                    <Text className={`font-inter-bold text-[13px] ${styleConfig.fontSize === size ? 'text-white' : 'text-zinc-400'}`}>{size}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Immersive Color Swatches */}
                                    <View className="mb-20">
                                        <Text className="text-sm text-white font-inter-bold uppercase tracking-widest pl-1 mb-5">Paleta Neon</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                                            {[
                                                { val: '#FFFFFF', name: 'Branco' },
                                                { val: '#FFEB3B', name: 'Hormozi Yellow' },
                                                { val: '#00FA9A', name: 'Blink Green' },
                                                { val: '#FF3366', name: 'CapCut Red' },
                                                { val: '#00FFFF', name: 'Neon Blue' },
                                                { val: '#FF9900', name: 'Amazon Orange' },
                                                { val: '#E6E6FA', name: 'Lavender' }
                                            ].map(color => (
                                                <TouchableOpacity
                                                    key={color.val}
                                                    onPress={() => setStyleConfig({ ...styleConfig, color: color.val })}
                                                    className={`mr-4 w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all ${styleConfig.color === color.val ? 'border-primary shadow-[0_0_15px_rgba(94,43,255,0.6)] scale-110' : 'border-white/10'}`}
                                                    style={{ backgroundColor: color.val }}
                                                >
                                                    {styleConfig.color === color.val && <View className="w-3 h-3 rounded-full bg-black/80" />}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </ScrollView>
                            )}
                        </View>
                    )}
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}
