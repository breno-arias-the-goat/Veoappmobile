import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { VideoPlayer, SubtitleStyle } from '../../components/specific/VideoPlayer';
import { useSubtitles, Subtitle } from '../../hooks/useSubtitles';
import api from '../../lib/api';
import { StatusBar } from 'expo-status-bar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── CapCut Presets (sincronizados com o web) ────────────────────────────────
const PRESETS: { id: string; name: string; emoji: string; style: SubtitleStyle }[] = [
    {
        id: 'classic', name: 'Classic', emoji: '⭐',
        style: { fontFamily: 'Inter-Black', fontSize: 22, fontWeight: '800', textColor: '#FFFFFF', highlightColor: '#FFD93D', highlightTextColor: '#000000', backgroundColor: 'rgba(0,0,0,0.75)', backgroundOpacity: 0.75, outlineColor: '#000000', outlineWidth: 0, shadowBlur: 6, shadowColor: '#000000', borderRadius: 8, padding: 10, position: 'bottom', animationIn: 'pop', uppercase: false, wordHighlight: true },
    },
    {
        id: 'fire', name: 'Fire', emoji: '🔥',
        style: { fontFamily: 'Inter-Black', fontSize: 24, fontWeight: '900', textColor: '#FFFFFF', highlightColor: '#FF6B35', highlightTextColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.0)', backgroundOpacity: 0, outlineColor: '#FF6B35', outlineWidth: 3, shadowBlur: 12, shadowColor: '#FF6B35', borderRadius: 0, padding: 8, position: 'bottom', animationIn: 'pop', uppercase: true, wordHighlight: true },
    },
    {
        id: 'neon', name: 'Neon', emoji: '💜',
        style: { fontFamily: 'Inter-Black', fontSize: 22, fontWeight: '800', textColor: '#FFFFFF', highlightColor: '#00F5FF', highlightTextColor: '#000000', backgroundColor: 'rgba(0,0,0,0.0)', backgroundOpacity: 0, outlineColor: '#00F5FF', outlineWidth: 2, shadowBlur: 16, shadowColor: '#00F5FF', borderRadius: 4, padding: 8, position: 'bottom', animationIn: 'fadeIn', uppercase: false, wordHighlight: true },
    },
    {
        id: 'bold', name: 'Bold', emoji: '💥',
        style: { fontFamily: 'Inter-Black', fontSize: 26, fontWeight: '900', textColor: '#FFFFFF', highlightColor: '#6C63FF', highlightTextColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.0)', backgroundOpacity: 0, outlineColor: '#000000', outlineWidth: 4, shadowBlur: 0, shadowColor: '#000000', borderRadius: 6, padding: 6, position: 'bottom', animationIn: 'slideUp', uppercase: true, wordHighlight: true },
    },
    {
        id: 'minimal', name: 'Minimal', emoji: '✦',
        style: { fontFamily: 'Inter', fontSize: 20, fontWeight: '600', textColor: '#FFFFFF', highlightColor: '#FFFFFF', highlightTextColor: '#000000', backgroundColor: 'rgba(0,0,0,0.6)', backgroundOpacity: 0.6, outlineColor: '#000000', outlineWidth: 0, shadowBlur: 4, shadowColor: '#000000', borderRadius: 12, padding: 12, position: 'bottom', animationIn: 'fadeIn', uppercase: false, wordHighlight: false },
    },
    {
        id: 'tiktok', name: 'TikTok', emoji: '🎵',
        style: { fontFamily: 'Inter-Black', fontSize: 24, fontWeight: '900', textColor: '#FFFFFF', highlightColor: '#FE2C55', highlightTextColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.0)', backgroundOpacity: 0, outlineColor: '#000000', outlineWidth: 3, shadowBlur: 8, shadowColor: '#000000', borderRadius: 4, padding: 8, position: 'bottom', animationIn: 'pop', uppercase: false, wordHighlight: true },
    },
];

const COLORS = [
    { val: '#FFFFFF', name: 'Branco' },
    { val: '#FFD93D', name: 'Hormozi Yellow' },
    { val: '#00FA9A', name: 'Blink Green' },
    { val: '#FF3366', name: 'CapCut Red' },
    { val: '#00FFFF', name: 'Neon Blue' },
    { val: '#FF9900', name: 'Amazon Orange' },
    { val: '#5E2BFF', name: 'VEO Purple' },
    { val: '#FE2C55', name: 'TikTok Pink' },
];

const FONTS = [
    { id: 'Inter-Black', label: 'Inter Black', icon: 'bold' },
    { id: 'Inter-Bold', label: 'Inter Bold', icon: 'font' },
    { id: 'Inter', label: 'Inter Regular', icon: 'align-left' },
];

export default function CaptionEditorScreen() {
    const { videoUri, videoId } = useLocalSearchParams();
    const router = useRouter();
    const { subtitlesQuery, generateMutation, updateMutation, checkJobStatus } = useSubtitles(videoId as string);

    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedPreset, setSelectedPreset] = useState('classic');
    const [styleConfig, setStyleConfig] = useState<SubtitleStyle>(PRESETS[0].style);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [activeTab, setActiveTab] = useState<'text' | 'style' | null>('style');

    const subtitles: Subtitle[] = subtitlesQuery.data || [];

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            setProgress(0);
            const result = await generateMutation.mutateAsync({ language: 'pt-BR' });
            const { jobId } = result;
            let pollCount = 0;
            const MAX_POLLS = 300;
            const POLL_INTERVAL = 3000;
            const poll = setInterval(async () => {
                pollCount++;
                if (pollCount > MAX_POLLS) {
                    clearInterval(poll);
                    setIsGenerating(false);
                    Alert.alert('Timeout', 'A geração excedeu 15 minutos. Tente com um vídeo menor.');
                    return;
                }
                try {
                    const statusData = await checkJobStatus(jobId);
                    if (statusData) {
                        setProgress(statusData.progress ?? 0);
                        if (statusData.status === 'completed') {
                            clearInterval(poll);
                            setIsGenerating(false);
                            subtitlesQuery.refetch();
                            Alert.alert('Sucesso! ✦', 'Suas legendas foram geradas com IA.');
                        } else if (statusData.status === 'failed') {
                            clearInterval(poll);
                            setIsGenerating(false);
                            Alert.alert('Erro na Geração', statusData.errorMessage || 'Falha ao gerar legendas. Tente novamente.');
                        }
                    }
                } catch (e: any) {
                    console.warn('[CaptionEditor] Poll error:', e.message);
                }
            }, POLL_INTERVAL);
        } catch (error: any) {
            setIsGenerating(false);
            Alert.alert('Erro', error.message || 'Falha ao iniciar geração de legendas.');
        }
    };

    const saveEdit = async (subtitleId: string) => {
        if (!editValue.trim() || !subtitleId) { setEditingId(null); return; }
        try {
            await updateMutation.mutateAsync({ subtitleId, text: editValue });
        } catch (e: any) {
            Alert.alert('Erro ao salvar', e.message);
        }
        setEditingId(null);
    };

    const handleApplyBurn = async () => {
        try {
            setIsGenerating(true);
            setProgress(10);
            // Normaliza campos para o backend (usa os mesmos nomes do web)
            const exportPayload = {
                ...styleConfig,
                // Garante que textColor e color estão ambos presentes
                textColor: styleConfig.textColor || styleConfig.color || '#FFFFFF',
                color: styleConfig.textColor || styleConfig.color || '#FFFFFF',
                // Garante que fontWeight está presente
                fontWeight: styleConfig.fontWeight || '800',
                // Garante que campos numéricos têm defaults
                outlineWidth: styleConfig.outlineWidth ?? 0,
                shadowBlur: styleConfig.shadowBlur ?? 0,
                borderRadius: styleConfig.borderRadius ?? 8,
                padding: styleConfig.padding ?? 8,
                backgroundOpacity: styleConfig.backgroundOpacity ?? 0,
            };
            setProgress(30);
            await api.post(`/subtitles/video/${videoId}/render`, exportPayload);
            setIsGenerating(false);
            setProgress(0);
            Alert.alert(
                'Exportação Iniciada ✦',
                'Seu vídeo está sendo processado na nuvem com as legendas. Aparecerá pronto na sua galeria em breve.',
                [{ text: 'Ver Projetos', onPress: () => router.replace('/(tabs)/subtitles') }]
            );
        } catch (error: any) {
            setIsGenerating(false);
            setProgress(0);
            Alert.alert('Erro Técnico', error.message || 'Falha ao enviar parâmetros de renderização para a nuvem.');
        }
    };

    const applyPreset = (presetId: string) => {
        const preset = PRESETS.find(p => p.id === presetId);
        if (preset) { setSelectedPreset(presetId); setStyleConfig(preset.style); }
    };

    const formatMs = (ms: number) => {
        const total = Math.floor(ms / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!videoUri || !videoId) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <Text style={{ color: 'white' }}>Vídeo não encontrado.</Text>
            </View>
        );
    }

    const FloatingToolbar = () => (
        <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16, zIndex: 50 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 50 }}>
                <TouchableOpacity
                    onPress={() => setActiveTab(activeTab === 'text' ? null : 'text')}
                    style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 50, marginRight: 4, backgroundColor: activeTab === 'text' ? '#5E2BFF' : 'transparent', flexDirection: 'row', alignItems: 'center' }}
                >
                    <FontAwesome name="align-left" size={12} color="white" style={{ marginRight: 6 }} />
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Textos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab(activeTab === 'style' ? null : 'style')}
                    style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 50, marginRight: 4, backgroundColor: activeTab === 'style' ? '#5E2BFF' : 'transparent', flexDirection: 'row', alignItems: 'center' }}
                >
                    <FontAwesome name="paint-brush" size={12} color="white" style={{ marginRight: 6 }} />
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Estilos</Text>
                </TouchableOpacity>
                {subtitles.length === 0 && !subtitlesQuery.isLoading && !isGenerating && (
                    <TouchableOpacity
                        onPress={handleGenerate}
                        style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 50, backgroundColor: 'rgba(94,43,255,0.3)', borderWidth: 1, borderColor: 'rgba(94,43,255,0.5)', flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}
                    >
                        <FontAwesome name="magic" size={12} color="#A78BFA" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#A78BFA', fontWeight: '700', fontSize: 14 }}>Auto IA</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'bottom']}>
            <StatusBar style="light" />

            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                <VideoPlayer
                    videoUri={videoUri as string}
                    subtitles={subtitles}
                    subtitleStyle={styleConfig}
                    onSubtitlePositionChange={(x, y) => setStyleConfig({ ...styleConfig, positionX: x, positionY: y })}
                />
                {isGenerating && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                        <ActivityIndicator color="#5E2BFF" size="large" style={{ marginBottom: 24 }} />
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 22, marginBottom: 12 }}>Mágica I.A em curso</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, textAlign: 'center', paddingHorizontal: 40, fontSize: 15, lineHeight: 22 }}>
                            Ouvindo, transcrevendo e animando suas palavras... {progress}%
                        </Text>
                        <View style={{ width: 256, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                            <View style={{ height: '100%', backgroundColor: '#5E2BFF', borderRadius: 4, width: `${progress}%` }} />
                        </View>
                    </View>
                )}
            </View>

            <View style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
                <TouchableOpacity
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/subtitles')}
                    style={{ width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                >
                    <FontAwesome name="chevron-left" size={16} color="white" style={{ marginLeft: -2 }} />
                </TouchableOpacity>
                {!subtitlesQuery.isLoading && subtitles.length > 0 && !isGenerating && (
                    <TouchableOpacity
                        onPress={handleApplyBurn}
                        style={{ backgroundColor: '#5E2BFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, flexDirection: 'row', alignItems: 'center' }}
                    >
                        <FontAwesome name="check" size={12} color="white" style={{ marginRight: 6 }} />
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Exportar</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FloatingToolbar />

            {activeTab !== null && (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40 }}>
                    <View style={{ backgroundColor: 'rgba(10,10,12,0.97)', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: SCREEN_HEIGHT * 0.5 }}>
                        <TouchableOpacity onPress={() => setActiveTab(null)} style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
                            <View style={{ width: 48, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }} />
                        </TouchableOpacity>

                        {subtitlesQuery.isLoading ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator color="#5E2BFF" size="large" />
                            </View>
                        ) : (
                            <View style={{ flex: 1 }}>
                                {activeTab === 'text' && (
                                    <View style={{ flex: 1 }}>
                                        <View style={{ paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>Suas Palavras</Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{subtitles.length} blocos</Text>
                                        </View>
                                        {subtitles.length === 0 ? (
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
                                                <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
                                                    Nenhuma legenda ainda. Use o botão "Auto IA" para gerar.
                                                </Text>
                                            </View>
                                        ) : (
                                            <FlatList
                                                data={subtitles}
                                                keyExtractor={item => item.id}
                                                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                                showsVerticalScrollIndicator={false}
                                                renderItem={({ item }) => (
                                                    <View style={{ marginBottom: 16, backgroundColor: '#18181B', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                            <Text style={{ fontSize: 12, color: '#A78BFA', fontWeight: '700', backgroundColor: 'rgba(167,139,250,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                                                                {formatMs(item.startTimeMs)} - {formatMs(item.endTimeMs)}
                                                            </Text>
                                                            {editingId === item.id ? (
                                                                <TouchableOpacity onPress={() => saveEdit(item.id)} style={{ backgroundColor: '#5E2BFF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 50, flexDirection: 'row', alignItems: 'center' }}>
                                                                    <FontAwesome name="check" size={10} color="white" style={{ marginRight: 4 }} />
                                                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>Salvar</Text>
                                                                </TouchableOpacity>
                                                            ) : (
                                                                <TouchableOpacity onPress={() => { setEditingId(item.id); setEditValue(item.text); }} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 50 }}>
                                                                    <FontAwesome name="pencil" size={14} color="#A1A1AA" />
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                        {editingId === item.id ? (
                                                            <TextInput
                                                                style={{ color: 'white', fontSize: 17, backgroundColor: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(94,43,255,0.5)' }}
                                                                value={editValue}
                                                                onChangeText={setEditValue}
                                                                multiline
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, lineHeight: 24 }}>{item.text}</Text>
                                                        )}
                                                    </View>
                                                )}
                                            />
                                        )}
                                    </View>
                                )}

                                {activeTab === 'style' && (
                                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 100 }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8, marginBottom: 12 }}>✦ Presets CapCut</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 10 }}>
                                            {PRESETS.map(preset => (
                                                <TouchableOpacity
                                                    key={preset.id}
                                                    onPress={() => applyPreset(preset.id)}
                                                    style={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: selectedPreset === preset.id ? '#5E2BFF' : 'rgba(255,255,255,0.08)', backgroundColor: selectedPreset === preset.id ? 'rgba(94,43,255,0.2)' : '#18181B', minWidth: 80 }}
                                                >
                                                    <Text style={{ fontSize: 24, marginBottom: 4 }}>{preset.emoji}</Text>
                                                    <Text style={{ color: selectedPreset === preset.id ? '#A78BFA' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>{preset.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>

                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12 }}>Fonte</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                            {FONTS.map(font => (
                                                <TouchableOpacity
                                                    key={font.id}
                                                    onPress={() => setStyleConfig({ ...styleConfig, fontFamily: font.id })}
                                                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: styleConfig.fontFamily === font.id ? '#5E2BFF' : 'rgba(255,255,255,0.08)', backgroundColor: styleConfig.fontFamily === font.id ? 'rgba(94,43,255,0.2)' : '#18181B', flexDirection: 'row', alignItems: 'center' }}
                                                >
                                                    <FontAwesome name={font.icon as any} size={14} color={styleConfig.fontFamily === font.id ? 'white' : '#71717A'} style={{ marginRight: 8 }} />
                                                    <Text style={{ color: styleConfig.fontFamily === font.id ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: styleConfig.fontFamily === font.id ? '700' : '400' }}>{font.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>

                                        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#18181B', borderRadius: 24, padding: 20 }}>
                                            <View>
                                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Impacto</Text>
                                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Tamanho da Letra</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 50, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                                {[22, 28, 34, 42].map(size => (
                                                    <TouchableOpacity
                                                        key={size}
                                                        onPress={() => setStyleConfig({ ...styleConfig, fontSize: size })}
                                                        style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: styleConfig.fontSize === size ? '#5E2BFF' : 'transparent' }}
                                                    >
                                                        <Text style={{ color: styleConfig.fontSize === size ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 13 }}>{size}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12 }}>Cor de Destaque</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
                                            {COLORS.map(color => (
                                                <TouchableOpacity
                                                    key={color.val}
                                                    onPress={() => setStyleConfig({ ...styleConfig, highlightColor: color.val, highlightTextColor: color.val === '#FFFFFF' ? '#000000' : '#FFFFFF' })}
                                                    style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: styleConfig.highlightColor === color.val ? '#5E2BFF' : 'rgba(255,255,255,0.1)', backgroundColor: color.val, alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    {styleConfig.highlightColor === color.val && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.6)' }} />}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>

                                        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <View>
                                                <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Destaque Palavra a Palavra</Text>
                                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Estilo CapCut / Captions</Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => setStyleConfig({ ...styleConfig, wordHighlight: !styleConfig.wordHighlight })}
                                                style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: styleConfig.wordHighlight ? '#5E2BFF' : 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingHorizontal: 2 }}
                                            >
                                                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'white', alignSelf: styleConfig.wordHighlight ? 'flex-end' : 'flex-start' }} />
                                            </TouchableOpacity>
                                        </View>

                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12 }}>Posição</Text>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            {(['top', 'middle', 'bottom'] as const).map(pos => (
                                                <TouchableOpacity
                                                    key={pos}
                                                    onPress={() => setStyleConfig({ ...styleConfig, position: pos })}
                                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: styleConfig.position === pos ? '#5E2BFF' : 'rgba(255,255,255,0.08)', backgroundColor: styleConfig.position === pos ? 'rgba(94,43,255,0.2)' : '#18181B', alignItems: 'center' }}
                                                >
                                                    <Text style={{ color: styleConfig.position === pos ? '#A78BFA' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>
                                                        {pos === 'top' ? '▲ Topo' : pos === 'middle' ? '◉ Meio' : '▼ Rodapé'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                )}
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}
