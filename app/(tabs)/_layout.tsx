import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, useColorScheme } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5E2BFF', // True Primary Tailwind
        tabBarInactiveTintColor: '#A1A1AA', // Zinc Gray
        lazy: true, // Optimizes Expo Go memory by not rendering off-screen tabs
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: 'rgba(255,255,255,0.08)', // Apple like minimal border
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
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          tabBarLabel: 'Home',
          headerTitle: () => (
            <Image
              source={require('../../assets/images/veo-logo.png')}
              style={{ width: 120, height: 40 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scripts"
        options={{
          title: 'Scripts',
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="create-script"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-script"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Vídeos',
          tabBarIcon: ({ color }) => <TabBarIcon name="video-camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="folders"
        options={{
          title: 'Pastas',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="folder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="subtitles"
        options={{
          href: null, // Removed from bottom bar
        }}
      />
    </Tabs>
  );
}
