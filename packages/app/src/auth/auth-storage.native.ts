import type { AuthStorage, AuthTokens } from './auth-storage';

const ACCESS_TOKEN_KEY = 'innera_access_token';
const REFRESH_TOKEN_KEY = 'innera_refresh_token';

let SecureStore: {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SecureStore = require('expo-secure-store');
} catch {
  // expo-secure-store not available, fall back to AsyncStorage below
}

let AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null = null;

if (!SecureStore) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch {
    // Neither available
  }

  if (AsyncStorage) {
    console.warn(
      '[innera] expo-secure-store not available, falling back to AsyncStorage. Tokens will NOT be stored securely.',
    );
  }
}

export const authStorage: AuthStorage = {
  async getTokens() {
    try {
      if (SecureStore) {
        const [accessToken, refreshToken] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        ]);
        if (!refreshToken) return null;
        return { accessToken: accessToken || null, refreshToken };
      }
      if (AsyncStorage) {
        const [accessToken, refreshToken] = await Promise.all([
          AsyncStorage.getItem(ACCESS_TOKEN_KEY),
          AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        ]);
        if (!refreshToken) return null;
        return { accessToken: accessToken || null, refreshToken };
      }
      return null;
    } catch {
      return null;
    }
  },

  async setTokens(tokens: AuthTokens) {
    try {
      if (SecureStore) {
        const ops: Promise<void>[] = [SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken)];
        if (tokens.accessToken) ops.push(SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken));
        await Promise.all(ops);
        return;
      }
      if (AsyncStorage) {
        // Only persist the refresh token when falling back to AsyncStorage.
        // Access tokens are short-lived and should not be stored in insecure storage.
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } catch (err) {
      console.warn('Failed to persist tokens:', err);
    }
  },

  async clearTokens() {
    try {
      if (SecureStore) {
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        ]);
        return;
      }
      if (AsyncStorage) {
        await Promise.all([
          AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
          AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        ]);
      }
    } catch {
      // ignore
    }
  },
};
