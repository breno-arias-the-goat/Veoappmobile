import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

let hasShownSessionPaywall = false;

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isPro, isLoading } = useAuth();

  useEffect(() => {
    // Se terminou de carregar o usuário, ele não é Pro, e o aviso ainda não foi exibido na sessão:
    if (!isLoading && !isPro && !hasShownSessionPaywall) {
      hasShownSessionPaywall = true;
      // Pequeno timeout visual para evitar piscar o componente enquanto renderiza
      setTimeout(() => {
        router.push('/(paywall)');
      }, 500);
    }
  }, [isPro, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5E2BFF',
        tabBarInactiveTintColor: '#A1A1AA',
        lazy: true,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'Inter_700Bold',
        },
      }}>

      {/* ── Tab 1: Roteiros ─────────────────────────────── */}
      <Tabs.Screen
        name="scripts"
        options={{
          title: t('tabs.scripts'),
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} />,
          headerTitle: () => (
            <Image
              source={require('../../assets/images/veo-logo.png')}
              style={{ width: 120, height: 40 }}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* ── Tab 2: Gravar ───────────────────────────────── */}
      <Tabs.Screen
        name="record"
        options={{
          title: t('tabs.record'),
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="microphone" color={color} />,
        }}
      />

      {/* ── Tab 3: Vídeos ───────────────────────────────── */}
      <Tabs.Screen
        name="videos"
        options={{
          title: t('tabs.videos'),
          tabBarIcon: ({ color }) => <TabBarIcon name="video-camera" color={color} />,
        }}
      />

      {/* ── Tab 4: Legendas ─────────────────────────────── */}
      <Tabs.Screen
        name="subtitles"
        options={{
          title: t('tabs.subtitles'),
          tabBarIcon: ({ color }) => <TabBarIcon name="cc" color={color} />,
        }}
      />

      {/* ── Tab 5: Perfil ───────────────────────────────── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />

      {/* ── Telas ocultas da nav bar ─────────────────────── */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="create-script" options={{ href: null }} />
      <Tabs.Screen name="edit-script" options={{ href: null }} />
      <Tabs.Screen name="folders" options={{ href: null }} />
    </Tabs>
  );
}
