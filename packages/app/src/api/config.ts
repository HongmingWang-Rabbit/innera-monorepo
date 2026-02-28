import { Platform } from 'react-native';

const DEFAULT_API_PORT = 3001;
const DEFAULT_API_URL = `http://localhost:${DEFAULT_API_PORT}`;

function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    // Next.js injects NEXT_PUBLIC_ env vars at build time
    if (typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_API_BASE_URL']) {
      return process.env['NEXT_PUBLIC_API_BASE_URL'];
    }
    return DEFAULT_API_URL;
  }

  // React Native (iOS/Android)
  // expo-constants extra or fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants') as { default?: { expoConfig?: { extra?: { apiBaseUrl?: string } } } };
    const url = Constants.default?.expoConfig?.extra?.apiBaseUrl;
    if (url) {
      return url;
    }
  } catch {
    // expo-constants not available
  }

  // Android emulator uses 10.0.2.2 to reach host localhost
  if (Platform.OS === 'android') return `http://10.0.2.2:${DEFAULT_API_PORT}`;
  return DEFAULT_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();
