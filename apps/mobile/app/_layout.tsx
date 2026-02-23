import { Provider } from '@innera/app';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // TODO: Gate splash screen hiding on readiness (fonts loaded, auth checked, etc.)
  // Example pattern:
  //   const [appReady, setAppReady] = useState(false);
  //   useEffect(() => {
  //     async function prepare() {
  //       await loadFonts();
  //       await checkAuth();
  //       setAppReady(true);
  //     }
  //     prepare();
  //   }, []);
  //   useEffect(() => {
  //     if (appReady) SplashScreen.hideAsync();
  //   }, [appReady]);
  //   if (!appReady) return null;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <Provider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          <Stack.Screen name="index" />
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
            name="circles/index"
            options={{
              headerShown: true,
              title: 'Circles',
            }}
          />
          <Stack.Screen
            name="circles/[id]"
            options={{
              headerShown: true,
              title: 'Circle',
            }}
          />
          <Stack.Screen
            name="partner"
            options={{
              headerShown: true,
              title: 'Partner',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: 'Settings',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              title: 'Notifications',
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: true,
              title: 'Profile',
            }}
          />
        </Stack>
      </Provider>
    </SafeAreaProvider>
  );
}
