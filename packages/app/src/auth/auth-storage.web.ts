import type { AuthStorage, AuthTokens } from './auth-storage';

const REFRESH_TOKEN_KEY = 'innera_refresh_token';

export const authStorage: AuthStorage = {
  async getTokens() {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;
      // Access token is kept in-memory only (not persisted) to mitigate XSS.
      return { accessToken: null, refreshToken };
    } catch {
      return null;
    }
  },

  async setTokens(tokens: AuthTokens) {
    try {
      // Only persist the refresh token. The access token lives in-memory
      // (via accessTokenRef in auth-provider) to reduce XSS attack surface.
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch {
      // localStorage may be unavailable in some contexts
    }
  },

  async clearTokens() {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};
