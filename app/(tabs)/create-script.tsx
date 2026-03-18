import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/base/Button';
import { Input } from '../../components/base/Input';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { createScript } from '../../services/scriptService';

const CONTEXTS = [
    'Falar em público',
    'Produção de vídeo',
    'Reportagem de notícias',
    'Apresentações de negócios',
    'Podcasting e gravação de locução',
    'Roteiros e Diálogos'
];

const TONES = [
    'Informativo',
    'Persuasivo',
    'Inspiracional/Motivacional',
    'Divertido',
    'Comemorativo/Cerimonial',
    'Discurso principal',
    'Político',
    'Debates'
];

const DURATIONS = [
    { id: 1, label: '1 min' },
    { id: 2, label: '2 min' },
    { id: 3, label: '3 min' },
    { id: 5, label: '5 min' },
    { id: 10, label: '10 min' },
];

const LOADING_STEPS = [
    '🧠 Analisando o tema...',
    '✍️ Escrevendo introdução...',
    '📝 Desenvolvendo o conteúdo...',
    '🎬 Finalizando o roteiro...',
    '💾 Salvando na sua conta...',
];

export default function CreateScriptScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { isPro } = useAuth();

    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [selectedContext, setSelectedContext] = useState(CONTEXTS[1]);
    const [selectedTone, setSelectedTone] = useState(TONES[0]);
    const [selectedDuration, setSelectedDuration] = useState(2);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const handleCreate = async () => {
        if (!isPro) {
            router.push('/(paywall)');
            return;
        }

        if (!title.trim() && !topic.trim()) {
            showToast('Por favor, informe o título ou tema do script', 'warning');
            return;
        }

        const finalTopic = title.trim()
            ? topic.trim() ? `${title.trim()} - ${topic.trim()}` : title.trim()
            : topic.trim();

        let stepInterval: ReturnType<typeof setInterval> | undefined;
        try {
            setLoading(true);
            setLoadingStep(0);

            // Animate loading steps while the API request runs
            stepInterval = setInterval(() => {
                setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
            }, 4000);

            const script = await createScript({
                topic: finalTopic,
                context: selectedContext,
                tone: selectedTone,
                durationMinutes: selectedDuration,
            });

            clearInterval(stepInterval);

            // Refresh scripts list cache
            queryClient.invalidateQueries({ queryKey: ['scripts'] });
            showToast('Script gerado e salvo! ✍️', 'success');

            // Navigate directly to edit screen with the new script
            if (script?.id) {
                router.replace({
                    pathname: '/(tabs)/edit-script',
                    params: { scriptId: script.id, isFromAi: 'true' }
                });
            } else {
                router.replace('/(tabs)/scripts');
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;

            if (status === 400) {
                showToast(`Dados inválidos: ${msg}`, 'error');
            } else if (status === 401) {
                showToast('Sessão expirada. Faça login novamente.', 'error');
            } else if (status === 503) {
                showToast('Serviço temporariamente indisponível. Tente novamente em instantes.', 'warning');
            } else if (status === 502) {
                showToast(msg || 'Erro ao conectar com a IA. Tente novamente.', 'error');
            } else if (error?.code === 'ECONNABORTED') {
                showToast('O servidor demorou muito. Tente novamente — pode estar acordando.', 'warning');
            } else {
                showToast(msg || 'Erro ao gerar script. Tente novamente.', 'error');
            }
        } finally {
            clearInterval(stepInterval);
            setLoading(false);
            setLoadingStep(0);
        }
    };

    const ChipSelector = ({
        options,
        selected,
        onSelect
    }: {
        options: string[];
        selected: string;
        onSelect: (val: string) => void;
    }) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {options.map((opt, idx) => (
                <TouchableOpacity
                    key={idx}
                    onPress={() => onSelect(opt)}
                    style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        backgroundColor: selected === opt ? '#4C24A0' : 'transparent',
                        borderColor: selected === opt ? '#4C24A0' : '#2D2D4A',
                        marginRight: 8,
                        marginBottom: 8,
                    }}
                >
                    <Text style={{ color: selected === opt ? '#fff' : '#BEACC3', fontWeight: '600', fontSize: 13 }}>
                        {opt}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                <View style={{
                    width: 80, height: 80, borderRadius: 40,
                    backgroundColor: '#1A0A30', justifyContent: 'center', alignItems: 'center',
                    marginBottom: 32, borderWidth: 2, borderColor: '#4C24A0'
                }}>
                    <ActivityIndicator size="large" color="#5E2BFF" />
                </View>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>
                    Gerando com IA...
                </Text>
                <Text style={{ color: '#BEACC3', fontSize: 16, textAlign: 'center', marginBottom: 40 }}>
                    {LOADING_STEPS[loadingStep]}
                </Text>
                <View style={{ width: '100%', backgroundColor: '#1A0A30', borderRadius: 12, padding: 16 }}>
                    {LOADING_STEPS.map((step, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < LOADING_STEPS.length - 1 ? 12 : 0 }}>
                            <View style={{
                                width: 20, height: 20, borderRadius: 10,
                                backgroundColor: i <= loadingStep ? '#4C24A0' : '#2D2D4A',
                                marginRight: 12, justifyContent: 'center', alignItems: 'center'
                            }}>
                                {i < loadingStep && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                                {i === loadingStep && <ActivityIndicator size="small" color="#fff" />}
                            </View>
                            <Text style={{ color: i <= loadingStep ? '#fff' : '#666', fontSize: 13 }}>{step}</Text>
                        </View>
                    ))}
                </View>
                <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
                    Pode levar até 30 segundos...
                </Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 52, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A2E' }}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/scripts')} style={{ marginRight: 16, padding: 8 }}>
                    <Text style={{ color: '#5E2BFF', fontSize: 15, fontWeight: 'bold' }}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 }}>✨ Criar Script com IA</Text>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 20 }}>
                    <Input
                        label="Título do Script"
                        placeholder="Ex: Introdução ao React Native"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={{ marginBottom: 20 }}>
                    <Input
                        label="Tema / Assunto Principal"
                        placeholder="Descreva o que o script deve abordar..."
                        value={topic}
                        onChangeText={setTopic}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={{ marginBottom: 24 }}>
                    <Text style={{ color: '#E0E0E0', fontWeight: 'bold', marginBottom: 12 }}>Contexto Formativo</Text>
                    <ChipSelector options={CONTEXTS} selected={selectedContext} onSelect={setSelectedContext} />
                </View>

                <View style={{ marginBottom: 24 }}>
                    <Text style={{ color: '#E0E0E0', fontWeight: 'bold', marginBottom: 12 }}>Tom da Fala</Text>
                    <ChipSelector options={TONES} selected={selectedTone} onSelect={setSelectedTone} />
                </View>

                <View style={{ marginBottom: 32 }}>
                    <Text style={{ color: '#E0E0E0', fontWeight: 'bold', marginBottom: 12 }}>Duração do Vídeo</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {DURATIONS.map(dur => (
                            <TouchableOpacity
                                key={dur.id}
                                onPress={() => setSelectedDuration(dur.id)}
                                style={{
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                    borderWidth: 1.5,
                                    backgroundColor: selectedDuration === dur.id ? '#4C24A0' : 'transparent',
                                    borderColor: selectedDuration === dur.id ? '#4C24A0' : '#2D2D4A',
                                    marginRight: 8,
                                    marginBottom: 8,
                                }}
                            >
                                <Text style={{ color: selectedDuration === dur.id ? '#fff' : '#BEACC3', fontWeight: '600' }}>
                                    {dur.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ marginBottom: 48 }}>
                    <Button
                        title="✨ Gerar Script com IA"
                        onPress={handleCreate}
                        loading={loading}
                        disabled={loading}
                    />
                    <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                        Após gerar, você poderá revisar e editar o roteiro 📝
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
