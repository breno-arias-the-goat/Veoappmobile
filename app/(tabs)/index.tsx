import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/base/Button';
import { EmptyState } from '../../components/specific/EmptyState';
import { ScriptCard } from '../../components/specific/ScriptCard';
import { VideoCard } from '../../components/specific/VideoCard';
import { useScripts } from '../../hooks/useScripts';
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
    <Animated.View style={{ opacity }} className="bg-surface rounded-2xl p-4 mb-3 border border-border">
      <View style={{ height: 14, width: '60%', backgroundColor: '#333', borderRadius: 7, marginBottom: 10 }} />
      <View style={{ height: 10, width: '90%', backgroundColor: '#2a2a2a', borderRadius: 5, marginBottom: 6 }} />
      <View style={{ height: 10, width: '75%', backgroundColor: '#2a2a2a', borderRadius: 5 }} />
    </Animated.View>
  );
}

function SkeletonSection({ count = 2 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}</>;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: scripts, isLoading: loadingScripts, refetch: refetchScripts, isRefetching: refetchingScripts } = useScripts();
  const { data: videos, isLoading: loadingVideos, refetch: refetchVideos, isRefetching: refetchingVideos } = useVideos();

  const handleRefresh = React.useCallback(() => {
    refetchScripts();
    refetchVideos();
  }, [refetchScripts, refetchVideos]);

  const recentScripts = scripts?.slice(0, 3) || [];
  const recentVideos = videos?.slice(0, 3) || [];
  const isRefreshing = refetchingScripts || refetchingVideos;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#5E2BFF" />}
      >
        <View className="mt-12 mb-8">
          <Text className="text-xs font-inter-bold text-text-secondary uppercase tracking-widest mb-2">{t('home.welcome')}</Text>
          <Text className="text-4xl font-inter-bold text-white tracking-tight">{t('home.dashboard')}</Text>
        </View>

        <View className="mb-xl">
          <Button
            title={t('home.create_script_btn')}
            onPress={() => router.push('/(tabs)/create-script')}
            className="w-full flex-row justify-center items-center"
          />
        </View>

        {/* Recent Videos */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-2xl font-inter-bold text-white tracking-tight">{t('home.recent_videos')}</Text>
            {recentVideos.length > 0 && (
              <Text onPress={() => router.push('/(tabs)/videos')} className="text-xs font-inter-bold text-primary uppercase tracking-wider">{t('home.see_all')}</Text>
            )}
          </View>
          {loadingVideos ? (
            <SkeletonSection count={2} />
          ) : recentVideos.length > 0 ? (
            recentVideos.map((video: any) => (
              <VideoCard
                key={video.id}
                title={video.title}
                duration={video.duration || 0}
                status={video.status || 'PENDING'}
                thumbnailUrl={video.thumbnailUrl}
              />
            ))
          ) : (
            <EmptyState title={t('home.no_videos_title')} description={t('home.no_videos_desc')} icon="video-camera" />
          )}
        </View>

        {/* Recent Scripts */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-2xl font-inter-bold text-white tracking-tight">{t('home.recent_scripts')}</Text>
            {recentScripts.length > 0 && (
              <Text onPress={() => router.push('/(tabs)/scripts')} className="text-xs font-inter-bold text-primary uppercase tracking-wider">{t('home.see_all')}</Text>
            )}
          </View>
          {loadingScripts ? (
            <SkeletonSection count={3} />
          ) : recentScripts.length > 0 ? (
            recentScripts.map((script: any) => (
              <ScriptCard
                key={script.id}
                title={script.title}
                excerpt={script.content}
                createdAt={script.createdAt || new Date().toISOString()}
                onRecord={() => router.push({ pathname: '/(tabs)/record', params: { scriptId: script.id } })}
                onEdit={() => router.push({ pathname: '/(tabs)/edit-script', params: { scriptId: script.id } })}
              />
            ))
          ) : (
            <EmptyState
              title={t('home.no_scripts_title')}
              description={t('home.no_scripts_desc')}
              icon="file-text-o"
              buttonTitle={t('home.create_script')}
              onButtonPress={() => router.push('/(tabs)/create-script')}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
