import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, FlatList, RefreshControl, View, TouchableOpacity, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { EmptyState } from '../../components/specific/EmptyState';
import { SearchBar } from '../../components/specific/SearchBar';
import { VideoCard } from '../../components/specific/VideoCard';
import { UploadModal } from '../../components/specific/UploadModal';
import { RenameModal } from '../../components/specific/RenameModal';
import { useVideos } from '../../hooks/useVideos';
import { useVideoUpload } from '../../hooks/useVideoUpload';
import { updateVideo } from '../../services/videoService';

function SkeletonCard() {
    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={{ opacity }} className="bg-surface rounded-2xl mb-3 border border-border overflow-hidden">
            <View style={{ height: 120, backgroundColor: '#1e1e2e' }} />
            <View style={{ padding: 12 }}>
                <View style={{ height: 14, width: '55%', backgroundColor: '#333', borderRadius: 7, marginBottom: 8 }} />
                <View style={{ height: 10, width: '35%', backgroundColor: '#2a2a2a', borderRadius: 5 }} />
            </View>
        </Animated.View>
    );
}

export default function VideosScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { data: videos, isLoading, refetch, isRefetching } = useVideos();
    const uploadVideoMutation = useVideoUpload();

    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Rename State
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [selectedVideoToRename, setSelectedVideoToRename] = useState<any>(null);
    const [isRenaming, setIsRenaming] = useState(false);

    const filteredVideos = useMemo(() => {
        if (!videos) return [];
        if (!searchQuery) return videos;
        return videos.filter((v: any) =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [videos, searchQuery]);

    const pickAndUploadVideo = async () => {
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
                    title: result.assets[0].fileName || `Video_${Date.now()}`, // Forward initial title
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

    const handleOpenRename = (video: any) => {
        setSelectedVideoToRename(video);
        setRenameModalVisible(true);
    };

    const handleSaveRename = async (newTitle: string) => {
        if (!selectedVideoToRename) return;

        try {
            setIsRenaming(true);
            await updateVideo(selectedVideoToRename.id, { title: newTitle });
            await refetch();
            setRenameModalVisible(false);
            setSelectedVideoToRename(null);
        } catch (error) {
            console.error('Failed to rename video:', error);
            Alert.alert('Erro', 'Falha ao renomear o projeto.');
        } finally {
            setIsRenaming(false);
        }
    };

    return (
        <View className="flex-1 bg-background px-6 pt-8">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-inter-bold text-white tracking-tight">Projetos</Text>
                <TouchableOpacity
                    onPress={pickAndUploadVideo}
                    disabled={isProcessing || uploadVideoMutation.isPending}
                    className={`bg-primary rounded-full px-4 py-2 flex-row items-center ${(isProcessing || uploadVideoMutation.isPending) ? 'opacity-50' : 'opacity-100'}`}
                >
                    <FontAwesome name="plus" size={14} color="#FFFFFF" className="mr-2" />
                    <Text className="text-white font-inter-bold text-sm">Importar</Text>
                </TouchableOpacity>
            </View>

            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('videos.search_placeholder')}
            />

            {isLoading && !isRefetching ? (
                <View style={{ flex: 1 }}>
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </View>
            ) : (
                <FlatList
                    data={filteredVideos}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
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
                            onLongPress={() => handleOpenRename(item)}
                        />
                    )}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#5E2BFF" />
                    }
                    ListEmptyComponent={() => (
                        <EmptyState
                            title={searchQuery ? t('videos.not_found_title') : t('videos.empty_title')}
                            description={searchQuery ? t('videos.not_found_desc') : t('videos.empty_desc')}
                            icon="video-camera"
                            buttonTitle={searchQuery ? undefined : t('videos.my_scripts')}
                            actionRoute="/(tabs)/scripts"
                        />
                    )}
                />
            )}

            <UploadModal
                visible={isProcessing || uploadVideoMutation.isPending}
                progress={uploadProgress}
                title={uploadProgress > 0 ? "Importando Vídeo..." : "Preparando Estúdio..."}
            />

            {/* Rename Modal */}
            <RenameModal
                visible={renameModalVisible}
                initialTitle={selectedVideoToRename?.title || ''}
                isUpdating={isRenaming}
                onClose={() => {
                    setRenameModalVisible(false);
                    setSelectedVideoToRename(null);
                }}
                onSave={handleSaveRename}
            />
        </View>
    );
}
