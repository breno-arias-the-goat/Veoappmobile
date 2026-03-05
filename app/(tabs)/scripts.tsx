import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, FlatList, RefreshControl, Text, View } from 'react-native';

import { Button } from '../../components/base/Button';
import { EmptyState } from '../../components/specific/EmptyState';
import { ScriptCard } from '../../components/specific/ScriptCard';
import { SearchBar } from '../../components/specific/SearchBar';
import { useToast } from '../../contexts/ToastContext';
import { useScripts } from '../../hooks/useScripts';
import { deleteScript } from '../../services/scriptService';

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
            <View style={{ height: 14, width: '55%', backgroundColor: '#333', borderRadius: 7, marginBottom: 10 }} />
            <View style={{ height: 10, width: '88%', backgroundColor: '#2a2a2a', borderRadius: 5, marginBottom: 6 }} />
            <View style={{ height: 10, width: '70%', backgroundColor: '#2a2a2a', borderRadius: 5 }} />
        </Animated.View>
    );
}

export default function ScriptsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { data: scripts, isLoading, refetch, isRefetching } = useScripts();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredScripts = useMemo(() => {
        if (!scripts) return [];
        if (!searchQuery) return scripts;
        return scripts.filter((s: any) =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.content && s.content.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [scripts, searchQuery]);

    const handleDeleteScript = async (scriptId: string) => {
        Alert.alert(
            t('scripts.delete_title'),
            t('scripts.delete_confirm'),
            [
                { text: t('scripts.delete_cancel'), style: 'cancel' },
                {
                    text: t('scripts.delete_action'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteScript(scriptId);
                            queryClient.invalidateQueries({ queryKey: ['scripts'] });
                            showToast(t('scripts.delete_success'), 'success');
                        } catch {
                            showToast(t('scripts.delete_error'), 'error');
                        }
                    }
                }
            ]
        );
    };

    const navigateToCreate = () => router.push('/(tabs)/create-script');

    return (
        <View className="flex-1 bg-background px-6 pt-12">
            <View className="mb-6">
                <Text className="text-4xl font-inter-bold text-white tracking-tight">{t('scripts.title')}</Text>
            </View>
            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('scripts.search_placeholder')}
            />

            {isLoading && !isRefetching ? (
                <View style={{ flex: 1 }}>
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </View>
            ) : (
                <FlatList
                    data={filteredScripts}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => (
                        <ScriptCard
                            title={item.title}
                            excerpt={item.content}
                            createdAt={item.createdAt || new Date().toISOString()}
                            onRecord={() => router.push({ pathname: '/(tabs)/record', params: { scriptId: item.id } })}
                            onEdit={() => router.push({ pathname: '/(tabs)/edit-script', params: { scriptId: item.id } })}
                            onDelete={() => handleDeleteScript(item.id)}
                        />
                    )}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#5E2BFF" />
                    }
                    ListEmptyComponent={() => (
                        <EmptyState
                            title={searchQuery ? t('scripts.not_found_title') : t('scripts.empty_title')}
                            description={searchQuery ? t('scripts.not_found_desc') : t('scripts.empty_desc')}
                            icon="file-text"
                            buttonTitle={searchQuery ? undefined : t('scripts.create_first')}
                            onButtonPress={searchQuery ? undefined : navigateToCreate}
                        />
                    )}
                />
            )}

            <View className="py-4 border-t border-border bg-background flex-row justify-between gap-4">
                <View className="flex-1">
                    <Button title={t('scripts.generate_ai')} onPress={navigateToCreate} />
                </View>
                <View className="flex-1">
                    <Button title={t('scripts.create_manual')} variant="secondary" onPress={() => router.push('/(tabs)/edit-script')} />
                </View>
            </View>
        </View>
    );
}
