import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, RefreshControl, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from '../../components/specific/EmptyState';
import { ScriptCard } from '../../components/specific/ScriptCard';
import { VideoCard } from '../../components/specific/VideoCard';
import { useScripts } from '../../hooks/useScripts';
import { useVideos } from '../../hooks/useVideos';

function SkeletonVerticalCard() {
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
    <Animated.View style={{ opacity }} className="w-[160px] aspect-[9/16] bg-[#121214] border border-white/5 rounded-3xl mr-4 overflow-hidden p-4 justify-end">
      <View style={{ height: 14, width: '80%', backgroundColor: '#2a2a2a', borderRadius: 4, marginBottom: 8 }} />
      <View style={{ height: 10, width: '40%', backgroundColor: '#2a2a2a', borderRadius: 4 }} />
    </Animated.View>
  );
}

function SkeletonHorizontalCard() {
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
    <Animated.View style={{ opacity }} className="w-[280px] h-[140px] bg-[#121214] border border-white/5 rounded-3xl mr-4 p-5 justify-between">
      <View>
        <View style={{ height: 16, width: '60%', backgroundColor: '#2a2a2a', borderRadius: 4, marginBottom: 12 }} />
        <View style={{ height: 10, width: '90%', backgroundColor: '#2a2a2a', borderRadius: 4, marginBottom: 6 }} />
        <View style={{ height: 10, width: '70%', backgroundColor: '#2a2a2a', borderRadius: 4 }} />
      </View>
      <View className="flex-row justify-end gap-2">
        <View style={{ height: 36, width: 36, backgroundColor: '#2a2a2a', borderRadius: 18 }} />
        <View style={{ height: 36, width: 90, backgroundColor: '#2a2a2a', borderRadius: 18 }} />
      </View>
    </Animated.View>
  );
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

  const recentScripts = scripts?.slice(0, 5) || [];
  const recentVideos = videos?.slice(0, 5) || [];
  const isRefreshing = refetchingScripts || refetchingVideos;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#5E2BFF" />}
      >
        <View className="mt-12 mb-8 px-6">
          <Text className="text-xs font-inter-bold text-text-secondary uppercase tracking-widest mb-2">{t('home.welcome')}</Text>
          <Text className="text-4xl font-inter-bold text-white tracking-tight">{t('home.dashboard')}</Text>
        </View>

        {/* Hero Action Section */}
        <View className="px-6 mb-10">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/create-script')}
            className="w-full h-40 rounded-3xl overflow-hidden shadow-2xl shadow-primary/20"
          >
            <LinearGradient
              colors={['#5E2BFF', '#3B18A5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-full h-full p-6 flex-row items-center justify-between"
            >
              <View className="flex-1 pr-4">
                <Text className="text-white text-2xl font-inter-bold mb-2 tracking-tight">Novo Projeto</Text>
                <Text className="text-white/80 text-sm font-inter leading-relaxed">Crie um script com IA, organize e grave usando o teleprompter.</Text>
              </View>
              <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center backdrop-blur-md">
                <FontAwesome name="plus" size={24} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Videos */}
        <View className="mb-10 pl-6">
          <View className="flex-row justify-between items-center mb-5 pr-6">
            <Text className="text-2xl font-inter-bold text-white tracking-tight">{t('home.recent_videos')}</Text>
            {recentVideos.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/videos')}>
                <Text className="text-xs font-inter-bold text-primary uppercase tracking-wider">{t('home.see_all')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingVideos ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
              <SkeletonVerticalCard />
              <SkeletonVerticalCard />
              <SkeletonVerticalCard />
            </ScrollView>
          ) : recentVideos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
              {recentVideos.map((video: any) => (
                <VideoCard
                  key={video.id}
                  title={video.title}
                  duration={video.duration || 0}
                  status={video.status || 'PENDING'}
                  thumbnailUrl={video.thumbnailUrl}
                />
              ))}
            </ScrollView>
          ) : (
            <View className="pr-6">
              <EmptyState title={t('home.no_videos_title')} description={t('home.no_videos_desc')} icon="video-camera" />
            </View>
          )}
        </View>

        {/* Recent Scripts */}
        <View className="mb-8 pl-6">
          <View className="flex-row justify-between items-center mb-5 pr-6">
            <Text className="text-2xl font-inter-bold text-white tracking-tight">{t('home.recent_scripts')}</Text>
            {recentScripts.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/scripts')}>
                <Text className="text-xs font-inter-bold text-primary uppercase tracking-wider">{t('home.see_all')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingScripts ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
              <SkeletonHorizontalCard />
              <SkeletonHorizontalCard />
            </ScrollView>
          ) : recentScripts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24 }}>
              {recentScripts.map((script: any) => (
                <ScriptCard
                  key={script.id}
                  title={script.title}
                  excerpt={script.content}
                  createdAt={script.createdAt || new Date().toISOString()}
                  onRecord={() => router.push({ pathname: '/(tabs)/record', params: { scriptId: script.id } })}
                  onEdit={() => router.push({ pathname: '/(tabs)/edit-script', params: { scriptId: script.id } })}
                />
              ))}
            </ScrollView>
          ) : (
            <View className="pr-6">
              <EmptyState
                title={t('home.no_scripts_title')}
                description={t('home.no_scripts_desc')}
                icon="file-text-o"
                buttonTitle={t('home.create_script')}
                onButtonPress={() => router.push('/(tabs)/create-script')}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
