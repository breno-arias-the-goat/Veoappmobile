import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, FlatList, RefreshControl, View } from 'react-native';

import { EmptyState } from '../../components/specific/EmptyState';
import { SearchBar } from '../../components/specific/SearchBar';
import { VideoCard } from '../../components/specific/VideoCard';
import { useVideos } from '../../hooks/useVideos';

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
    const [searchQuery, setSearchQuery] = useState('');

    const filteredVideos = useMemo(() => {
        if (!videos) return [];
        if (!searchQuery) return videos;
        return videos.filter((v: any) =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [videos, searchQuery]);

    return (
        <View className="flex-1 bg-background px-6 pt-8">
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
                                if (item.videoUrl) {
                                    router.push({
                                        pathname: '/(main)/preview',
                                        params: {
                                            videoId: item.id,
                                            videoUri: item.videoUrl,
                                            isCloudVideo: 'true'
                                        }
                                    });
                                }
                            }}
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
        </View>
    );
}
