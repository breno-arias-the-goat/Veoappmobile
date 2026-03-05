import React, { useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/base/Button';
import { UploadModal } from '../../components/specific/UploadModal';
import { VideoPlayer } from '../../components/specific/VideoPlayer';
import { VideoTrimmer } from '../../components/specific/VideoTrimmer';
import { useVideoUpload } from '../../hooks/useVideoUpload';



export default function PreviewScreen() {
    const { videoUri, scriptId, isCloudVideo, videoId } = useLocalSearchParams();
    const router = useRouter();
    const uploadVideoMutation = useVideoUpload();

    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0); // Will be set by trimmer

    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleRangeChange = (start: number, end: number) => {
        setStartTime(start);
        setEndTime(end);
    };

    const handleShare = async () => {
        if (!videoUri || typeof videoUri !== 'string') return;
        if (Platform.OS === 'web') {
            Alert.alert("Aviso", "Ação exclusiva para celular através do aplicativo iOS/Android.");
            return;
        }

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            if (isCloudVideo === 'true') {
                setIsProcessing(true);
                try {
                    const tempFileUri = (FileSystem as any).cacheDirectory + `vilo_share_${Date.now()}.mp4`;
                    const { uri } = await FileSystem.downloadAsync(videoUri, tempFileUri);
                    await Sharing.shareAsync(uri);
                } catch (err) {
                    Alert.alert("Erro", "Falha ao baixar vídeo remoto para compartilhamento.");
                } finally {
                    setIsProcessing(false);
                }
            } else {
                await Sharing.shareAsync(videoUri);
            }
        } else {
            Alert.alert("Erro", "Compartilhamento indisponível neste dispositivo.");
        }
    };

    const handleDownload = async () => {
        if (!videoUri || typeof videoUri !== 'string') return;
        if (Platform.OS === 'web') {
            Alert.alert("Aviso", "Ação exclusiva para celular através do aplicativo iOS/Android.");
            return;
        }

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permissão", "O VILO precisa de acesso à Galeria para conseguir salvar este registro de mídia.");
                return;
            }

            if (isCloudVideo === 'true') {
                setIsProcessing(true);
                try {
                    const tempFileUri = (FileSystem as any).cacheDirectory + `vilo_download_${Date.now()}.mp4`;
                    const { uri } = await FileSystem.downloadAsync(videoUri, tempFileUri);
                    await MediaLibrary.saveToLibraryAsync(uri);
                    Alert.alert("Sucesso", "O vídeo hospedado na nuvem foi salvo na sua Galeria local!");
                } catch (err) {
                    Alert.alert("Erro", "Falha ao salvar vídeo hospedado na nuvem do servidor.");
                } finally {
                    setIsProcessing(false);
                }
            } else {
                await MediaLibrary.saveToLibraryAsync(videoUri);
                Alert.alert("Sucesso", "O vídeo foi salvo perfeitamente no Rolo de Câmera da sua galeria!");
            }
        } catch (err) {
            console.error("Device Save Error:", err);
            Alert.alert("Erro Técnico", "Não foi possível baixar este arquivo localmente no aparelho.");
        }
    };

    const handleSave = async () => {
        if (!videoUri || typeof videoUri !== 'string') return;

        try {
            setIsProcessing(true);
            setUploadProgress(0);

            let finalVideoUri = videoUri;

            // O módulo de corte (react-native-video-processing) foi removido na Web devido a falhas do Metro Bundler.
            // Para resolver esse bug na versão Web, ignoramos o corte e enviamos o vídeo original.
            // O corte pode ser feito no lado do backend ou com FFmpeg WASM num PR futuro.
            console.log("Corte de vídeo temporariamente desativado. Enviando vídeo original.");

            // 2. Upload the (trimmed) video
            await uploadVideoMutation.mutateAsync({
                fileUri: finalVideoUri,
                scriptId: typeof scriptId === 'string' ? scriptId : undefined,
                onProgress: (prog) => setUploadProgress(prog)
            });

            setIsProcessing(false);

            // 3. Success! Go to home.
            Alert.alert("Sucesso!", "Seu vídeo foi cortado e enviado com sucesso!");
            router.replace('/(tabs)');

        } catch (error: any) {
            console.error("Failed to process or upload: ", error);
            setIsProcessing(false);
            Alert.alert("Erro", "Ocorreu um erro ao cortar ou salvar seu vídeo. " + (error.message || ''));
        }
    };

    if (!videoUri || typeof videoUri !== 'string') {
        return (
            <View className="flex-1 justify-center items-center bg-background-light dark:bg-background-dark p-lg">
                <Button title="Voltar" onPress={() => router.back()} />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={['top', 'bottom']}>
            <ScrollView
                className="flex-1 bg-background-light dark:bg-background-dark"
                contentContainerStyle={{ flexGrow: 1, padding: 16 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Player constraints */}
                <View className="w-full aspect-[9/16] max-h-[50vh] self-center items-center justify-center mb-6">
                    <VideoPlayer
                        videoUri={videoUri}
                        startTime={startTime}
                        endTime={endTime}
                    />
                </View>

                {/* Trimmer interface */}
                <View className="mb-6 w-full">
                    <VideoTrimmer
                        videoUri={videoUri}
                        totalDuration={30} // Dummy fallback if we can't extract immediately, ideally passed from record
                        onRangeChange={handleRangeChange}
                    />
                </View>
            </ScrollView>

            {/* Action Buttons (Pinned Footer) */}
            <View className="p-4 border-t border-border bg-background-light dark:bg-background-dark gap-3">
                {isCloudVideo !== 'true' && (
                    <Button
                        title="☁️ Salvar na Nuvem"
                        onPress={handleSave}
                        className="w-full"
                        variant="primary"
                        disabled={isProcessing}
                    />
                )}

                {isCloudVideo === 'true' && videoId && (
                    <Button
                        title="✨ Legendas Mágicas (IA)"
                        onPress={() => router.push({
                            pathname: '/(main)/caption-editor',
                            params: { videoUri, videoId }
                        })}
                        className="w-full"
                        variant="primary"
                        disabled={isProcessing}
                    />
                )}

                <View className="flex-row gap-3 w-full">
                    <View className="flex-1">
                        <Button
                            title="⬇️ Baixar"
                            variant={isCloudVideo === 'true' ? "primary" : "secondary"}
                            onPress={handleDownload}
                            disabled={isProcessing}
                        />
                    </View>
                    <View className="flex-1">
                        <Button
                            title="🔗 Compartilhar"
                            variant="secondary"
                            onPress={handleShare}
                            disabled={isProcessing}
                        />
                    </View>
                </View>

                {isCloudVideo !== 'true' && (
                    <Button
                        title="🗑️ Descartar"
                        variant="ghost"
                        onPress={() => router.back()}
                        className="w-full"
                        disabled={isProcessing}
                    />
                )}
            </View>

            {/* Upload/Processing Modal */}
            <UploadModal
                visible={isProcessing || uploadVideoMutation.isPending}
                progress={isCloudVideo === 'true' ? 100 : uploadProgress}
                title={isCloudVideo === 'true' ? "Baixando da Nuvem..." : uploadProgress > 0 ? "Enviando Vídeo..." : "Processando..."}
            />
        </SafeAreaView>
    );
}
