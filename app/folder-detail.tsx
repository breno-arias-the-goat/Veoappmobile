import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { FolderPickerModal } from '../components/FolderPickerModal';

interface VideoItem {
    id: string;
    title: string;
    status: string;
    folderId?: string;
}

const fetchFolderVideos = async (folderId: string): Promise<VideoItem[]> => {
    const { data } = await api.get('/videos', { params: { folderId } });
    return data?.data?.videos || [];
};

export default function FolderDetailScreen() {
    const router = useRouter();
    const { folderId, folderName, folderEmoji } = useLocalSearchParams<{
        folderId: string;
        folderName: string;
        folderEmoji: string;
    }>();

    const { data: videos = [], isLoading, refetch } = useQuery<VideoItem[]>({
        queryKey: ['videos', 'folder', folderId],
        queryFn: () => fetchFolderVideos(folderId),
        enabled: Boolean(folderId),
    });

    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

    const openMoveModal = (videoId: string) => {
        setSelectedVideoId(videoId);
        setPickerVisible(true);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.emoji}>{folderEmoji || '📁'}</Text>
                <Text style={styles.folderName} numberOfLines={1}>{folderName}</Text>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            ) : videos.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🎬</Text>
                    <Text style={styles.emptyTitle}>Pasta vazia</Text>
                    <Text style={styles.emptyDesc}>
                        Mova vídeos para esta pasta usando o menu de ações nos seus vídeos.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={videos}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#6C63FF" />}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <View style={styles.videoRow}>
                            <View style={styles.videoInfo}>
                                <Text style={styles.videoEmoji}>🎥</Text>
                                <View style={styles.videoTexts}>
                                    <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.videoStatus}>{item.status}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.moveBtn}
                                onPress={() => openMoveModal(item.id)}
                            >
                                <Text style={styles.moveBtnText}>Mover</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            {selectedVideoId && (
                <FolderPickerModal
                    visible={pickerVisible}
                    itemId={selectedVideoId}
                    itemType="video"
                    currentFolderId={folderId}
                    onClose={() => {
                        setPickerVisible(false);
                        setSelectedVideoId(null);
                        refetch();
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    backBtn: { marginRight: 12, padding: 4 },
    backArrow: { color: '#6C63FF', fontSize: 22, fontWeight: '700' },
    emoji: { fontSize: 26, marginRight: 10 },
    folderName: { color: '#fff', fontSize: 20, fontWeight: '800', flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyDesc: { color: '#A1A1AA', textAlign: 'center', lineHeight: 22 },
    videoRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#181818',
        borderRadius: 12, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    videoInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    videoEmoji: { fontSize: 22, marginRight: 12 },
    videoTexts: { flex: 1 },
    videoTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
    videoStatus: { color: '#A1A1AA', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
    moveBtn: {
        borderWidth: 1, borderColor: '#6C63FF',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 8, marginLeft: 10,
    },
    moveBtnText: { color: '#6C63FF', fontWeight: '600', fontSize: 12 },
});
