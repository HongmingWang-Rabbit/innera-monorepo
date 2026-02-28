'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createApiClient, ApiError } from '../api/client';
import type { ApiClient } from '../api/client';
import { API } from '../api/endpoints';
import { API_BASE_URL } from '../api/config';
import { AuthContext, ApiClientContext } from './auth-context';
import type { AuthUser, AuthStatus } from './auth-context';
// Platform-resolved: webpack → auth-storage.web.ts, Metro → auth-storage.native.ts
import type { AuthStorage } from './auth-storage';
import { authStorage } from './auth-storage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REFRESH_BUFFER_SECONDS = 60;
const MIN_REFRESH_DELAY_MS = 5000;

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------
interface AuthResponse {
  statusCode: number;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUser;
  };
}

interface MeResponse {
  statusCode: number;
  data: AuthUser;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const accessTokenRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageRef = useRef<AuthStorage>(authStorage);
  const isGuestRef = useRef(false);

  // ---- Ref to always hold the latest doRefresh without stale closures ----
  const doRefreshRef = useRef<() => Promise<boolean>>(async () => false);

  // ---- Deduplicate concurrent refresh attempts ----
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  // -----------------------------------------------------------------------
  // handleLoggedOut
  // -----------------------------------------------------------------------
  const handleLoggedOut = useCallback(() => {
    accessTokenRef.current = null;
    isGuestRef.current = false;
    setUser(null);
    setStatus('unauthenticated');
    setIsGuest(false);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    void storageRef.current.clearTokens();
  }, []);

  // -----------------------------------------------------------------------
  // scheduleRefresh  (uses doRefreshRef so it never closes over a stale fn)
  // -----------------------------------------------------------------------
  const scheduleRefresh = useCallback((expiresIn: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max((expiresIn - REFRESH_BUFFER_SECONDS) * 1000, MIN_REFRESH_DELAY_MS);
    refreshTimerRef.current = setTimeout(() => {
      void doRefreshRef.current();
    }, delay);
  }, []);

  // -----------------------------------------------------------------------
  // apiClient  (uses doRefreshRef so onUnauthorized is never stale)
  // Deps are intentionally empty: baseUrl is a module-level constant,
  // getAccessToken and onUnauthorized read from refs so they never go stale.
  // -----------------------------------------------------------------------
  const apiClient = useMemo<ApiClient>(() => createApiClient({
    baseUrl: API_BASE_URL,
    getAccessToken: () => accessTokenRef.current,
    onUnauthorized: () => {
      // Don't attempt refresh in guest mode — no tokens to refresh
      if (isGuestRef.current) {
        return Promise.resolve(false);
      }
      return doRefreshRef.current();
    },
  }), []);

  // -----------------------------------------------------------------------
  // handleAuthResponse  (shared post-auth logic for login + refresh)
  // -----------------------------------------------------------------------
  const handleAuthResponse = useCallback(async (res: AuthResponse) => {
    accessTokenRef.current = res.data.accessToken;
    try {
      await storageRef.current.setTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
    } catch (err) {
      // Storage write failed (e.g. quota exceeded, permission denied).
      // The in-memory token is still valid so we continue.
      console.warn('[innera] Failed to persist tokens to storage', err);
    }
    setUser(res.data.user);
    setStatus('authenticated');
    setIsGuest(false);
    scheduleRefresh(res.data.expiresIn);
  }, [scheduleRefresh]);

  // -----------------------------------------------------------------------
  // doRefresh  (with deduplication via refreshPromiseRef)
  // -----------------------------------------------------------------------
  async function doRefreshImpl(): Promise<boolean> {
    try {
      const tokens = await storageRef.current.getTokens();
      if (!tokens?.refreshToken) {
        handleLoggedOut();
        return false;
      }

      const res = await apiClient.post<AuthResponse>(API.auth.refresh, {
        body: { refreshToken: tokens.refreshToken },
        skipAuthRetry: true,
      });

      await handleAuthResponse(res);
      return true;
    } catch (err) {
      console.warn('Token refresh failed:', err);
      handleLoggedOut();
      return false;
    }
  }

  function doRefresh(): Promise<boolean> {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    const promise = doRefreshImpl().finally(() => {
      refreshPromiseRef.current = null;
    });
    refreshPromiseRef.current = promise;
    return promise;
  }

  // Keep the ref up-to-date so callbacks always call latest version.
  // Done in a useEffect rather than during render to avoid side effects in render.
  useEffect(() => {
    doRefreshRef.current = doRefresh;
  });

  // -----------------------------------------------------------------------
  // Auth actions (stable callbacks)
  // -----------------------------------------------------------------------
  const loginWithGoogle = useCallback(async (params: { code: string; codeVerifier?: string; redirectUri: string }) => {
    const res = await apiClient.post<AuthResponse>(API.auth.googleCode, { body: params });
    await handleAuthResponse(res);
  }, [apiClient, handleAuthResponse]);

  const loginWithApple = useCallback(async (params: { code: string; identityToken: string; redirectUri: string }) => {
    const res = await apiClient.post<AuthResponse>(API.auth.appleCode, { body: params });
    await handleAuthResponse(res);
  }, [apiClient, handleAuthResponse]);

  const continueAsGuest = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    // Guest mode uses 'authenticated' status intentionally so navigation guards
    // treat guests the same as logged-in users. Always check `isGuest` alongside
    // `status` when distinguishing real auth from guest access.
    setStatus('authenticated');
    setIsGuest(true);
    isGuestRef.current = true;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessTokenRef.current) {
        await apiClient.post(API.auth.logout);
      }
    } catch {
      // Ignore logout API errors
    }
    handleLoggedOut();
  }, [apiClient, handleLoggedOut]);

  const refreshUser = useCallback(async () => {
    if (!accessTokenRef.current) return;
    try {
      const res = await apiClient.get<MeResponse>(API.auth.me);
      setUser(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        handleLoggedOut();
      }
    }
  }, [apiClient, handleLoggedOut]);

  // -----------------------------------------------------------------------
  // Initialize: restore session from stored tokens
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const tokens = await storageRef.current.getTokens();
      if (cancelled) return;

      if (!tokens?.refreshToken) {
        setStatus('unauthenticated');
        return;
      }

      // Set accessToken from storage so refresh call can auth if needed
      accessTokenRef.current = tokens.accessToken;
      const success = await doRefreshRef.current();

      if (cancelled) return;
      if (!success) {
        setStatus('unauthenticated');
      }
    }

    void init();

    return () => {
      cancelled = true;
      // Prevent scheduled refresh from firing after unmount
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value = useMemo(() => ({
    status,
    user,
    isGuest,
    loginWithGoogle,
    loginWithApple,
    continueAsGuest,
    logout,
    refreshUser,
  }), [status, user, isGuest, loginWithGoogle, loginWithApple, continueAsGuest, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      <ApiClientContext.Provider value={apiClient}>
        {children}
      </ApiClientContext.Provider>
    </AuthContext.Provider>
  );
}
