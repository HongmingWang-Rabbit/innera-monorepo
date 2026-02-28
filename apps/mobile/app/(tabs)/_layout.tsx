import { Tabs } from 'expo-router';
import { Home, Users, Heart, Bell, Settings } from '@tamagui/lucide-icons';
import { palette } from '@innera/app';

const ACTIVE_COLOR = palette.indigo500;
const INACTIVE_COLOR = palette.gray400;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        // React Navigation tabBarStyle only accepts plain ViewStyle values,
        // so raw palette values are used instead of Tamagui tokens.
        // Do NOT set an explicit `height` — it conflicts with the safe area
        // inset on notched iPhones and clips the label text.
        tabBarStyle: {
          backgroundColor: palette.warmWhite,
          borderTopWidth: 1,
          borderTopColor: palette.warmBorder,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="partner"
        options={{
          title: 'Partner',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
