import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useVideoUpload } from '../../hooks/useVideoUpload';
import { useVideos } from '../../hooks/useVideos';
import { UploadModal } from '../../components/specific/UploadModal';
import { VideoCard } from '../../components/specific/VideoCard';
import { EmptyState } from '../../components/specific/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { ProUpgradeModal } from '../../components/specific/ProUpgradeModal';

export default function SubtitlesScreen() {
    const router = useRouter();
    const uploadVideoMutation = useVideoUpload();
    const { data: videos, isLoading, refetch, isRefetching } = useVideos();
    const { isPro } = useAuth();

    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUpgradeModalVisible, setUpgradeModalVisible] = useState(false);

    const pickAndUploadVideo = async () => {
        if (!isPro && videos && videos.length >= 10) {
            setUpgradeModalVisible(true);
            return;
        }
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de permissão para acessar sua galeria.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const videoUri = result.assets[0].uri;

                setIsProcessing(true);
                setUploadProgress(0);

                const uploadResult = await uploadVideoMutation.mutateAsync({
                    fileUri: videoUri,
                    onProgress: (prog) => setUploadProgress(prog),
                });

                setIsProcessing(false);

                const uploadedVideoId = uploadResult?.videoId;

                if (uploadedVideoId) {
                    router.push({
                        pathname: '/(main)/caption-editor',
                        params: {
                            videoId: uploadedVideoId,
                            videoUri: uploadResult?.videoUrl,
                            isCloudVideo: 'true'
                        }
                    });
                } else {
                    Alert.alert('Erro', 'Vídeo enviado, mas não foi possível obter o ID.');
                }
            }
        } catch (error: any) {
            console.error('Error in pick and upload:', error);
            setIsProcessing(false);
            Alert.alert('Erro', error?.message || 'Falha ao processar e enviar o vídeo.');
        }
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header Sticky */}
            <View className="pt-12 px-6 pb-4 bg-background border-b border-border z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                            <FontAwesome name="cc" size={18} color="#5E2BFF" />
                        </View>
                        <Text className="text-xl font-inter-bold text-white">
                            Projetos
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={pickAndUploadVideo}
                        disabled={isProcessing || uploadVideoMutation.isPending}
                        className={`bg-primary rounded-full px-4 py-2 flex-row items-center ${(isProcessing || uploadVideoMutation.isPending) ? 'opacity-50' : 'opacity-100'}`}
                    >
                        <FontAwesome name="plus" size={14} color="#FFFFFF" className="mr-2" />
                        <Text className="text-white font-inter-bold text-sm">Novo</Text>
                    </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-400 font-inter">
                    Seus vídeos legendados com I.A ao estilo Captions.
                </Text>
            </View>

            {/* List Body */}
            <View className="flex-1 px-6 pt-4">
                {isLoading && !isRefetching ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#5E2BFF" />
                    </View>
                ) : (
                    <FlatList
                        data={videos}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <VideoCard
                                title={item.title}
                                duration={item.duration || 0}
                                status={item.status || 'PENDING'}
                                thumbnailUrl={item.thumbnailUrl}
                                onPress={() => {
                                    router.push({
                                        pathname: '/(main)/caption-editor',
                                        params: {
                                            videoId: item.id,
                                            videoUri: item.videoUrl || '',
                                            isCloudVideo: 'true'
                                        }
                                    });
                                }}
                            />
                        )}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                        refreshControl={
                            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#5E2BFF" />
                        }
                        ListEmptyComponent={() => (
                            <View className="mt-10">
                                <EmptyState
                                    title="Nenhum Projeto"
                                    description="Você ainda não legendou nenhum vídeo. Clique em Novo para começar as edições animadas."
                                    icon="video-camera"
                                    buttonTitle="Começar"
                                    actionRoute="/(tabs)/videos"
                                />
                            </View>
                        )}
                    />
                )}
            </View>

            {/* Upload Modal Overlay */}
            <UploadModal
                visible={isProcessing || uploadVideoMutation.isPending}
                progress={uploadProgress}
                title={uploadProgress > 0 ? "Importando Vídeo..." : "Preparando Estúdio..."}
            />

            <ProUpgradeModal
                visible={isUpgradeModalVisible}
                subtitle="Você atingiu o limite de 10 projetos simultâneos. Faça upgrade ou exclua vídeos para adicionar mais."
                onClose={() => setUpgradeModalVisible(false)}
            />
        </View>
    );
}
