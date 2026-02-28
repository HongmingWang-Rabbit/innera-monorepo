import { Provider } from '@innera/app';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      // TODO: load fonts, check auth, etc.
      setAppReady(true);
    }
    prepare().catch((err) => {
      console.error('App preparation failed:', err);
      setAppReady(true);
    });
  }, []);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <Provider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="entry/new"
            options={{
              headerShown: true,
              title: 'New Entry',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="entry/[id]"
            options={{
              headerShown: true,
              title: 'Entry',
            }}
          />
          <Stack.Screen
            name="circles/[id]"
            options={{
              headerShown: true,
              title: 'Circle',
            }}
          />
        </Stack>
      </Provider>
    </SafeAreaProvider>
  );
}
