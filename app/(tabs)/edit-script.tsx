import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/base/Button';
import { createManualScript, updateScript, getScriptById } from '../../services/scriptService';
import { useToast } from '../../contexts/ToastContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditScriptScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const scriptId = params.scriptId as string | undefined;
    const isEditing = !!scriptId;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditing);

    useEffect(() => {
        if (isEditing) {
            fetchScriptData();
        }
    }, [scriptId]);

    const fetchScriptData = async () => {
        try {
            setIsFetching(true);
            const data = await getScriptById(scriptId!);
            setTitle(data.title || '');
            setContent(data.content || '');
        } catch (error: any) {
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 503) {
                showToast('Serviço temporariamente indisponível. Tente novamente.', 'warning');
            } else {
                showToast(msg || 'Erro ao carregar script para edição.', 'error');
            }
            router.back();
        } finally {
            setIsFetching(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Atenção', 'Título e conteúdo são obrigatórios.');
            return;
        }

        try {
            setIsLoading(true);
            if (isEditing) {
                await updateScript(scriptId, { title, content });
                showToast('Script atualizado com sucesso!', 'success');
            } else {
                await createManualScript({ title, content });
                showToast('Novo script criado com sucesso!', 'success');
            }
            queryClient.invalidateQueries({ queryKey: ['scripts'] });
            router.push('/(tabs)/scripts');
        } catch (error: any) {
            const status = error?.response?.status;
            const msg = error?.response?.data?.message;
            if (status === 503) {
                showToast('Serviço temporariamente indisponível. Tente novamente em instantes.', 'warning');
            } else if (status === 401) {
                showToast('Sessão expirada. Faça login novamente.', 'error');
            } else {
                showToast(msg || 'Erro ao salvar o script. Tente novamente.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color="#4C24A0" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
                    <View className="mb-6 flex-row items-center justify-between">
                        <Text className="text-3xl font-inter-bold text-white tracking-tight">
                            {isEditing ? 'Editar Script' : 'Novo Script Manual'}
                        </Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-text-muted mb-2 font-inter-medium">Título do Roteiro</Text>
                        <TextInput
                            className="bg-surface border border-border rounded-xl px-4 py-4 text-white font-inter"
                            placeholder="Ex: Apresentação de Vendas..."
                            placeholderTextColor="#6B7280"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View className="flex-1 mb-6">
                        <Text className="text-text-muted mb-2 font-inter-medium">Conteúdo (Roteiro)</Text>
                        <TextInput
                            className="flex-1 bg-surface border border-border rounded-xl px-4 py-4 text-white font-inter"
                            placeholder="Escreva seu discurso aqui..."
                            placeholderTextColor="#6B7280"
                            multiline
                            textAlignVertical="top"
                            value={content}
                            onChangeText={setContent}
                        />
                    </View>

                    <Button
                        title={isEditing ? 'Salvar Alterações' : 'Criar Script'}
                        onPress={handleSave}
                        loading={isLoading}
                    />
                    <View className="mt-4">
                        <Button
                            title="Cancelar"
                            variant="secondary"
                            onPress={() => router.back()}
                            disabled={isLoading}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
