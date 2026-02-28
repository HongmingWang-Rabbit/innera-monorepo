'use client';

import { createContext } from 'react';
import type { ApiClient } from '../api/client';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  isGuest: boolean;
}

export interface AuthActions {
  loginWithGoogle: (params: { code: string; codeVerifier?: string; redirectUri: string }) => Promise<void>;
  loginWithApple: (params: { code: string; identityToken: string; redirectUri: string }) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<(AuthState & AuthActions) | null>(null);
export const ApiClientContext = createContext<ApiClient | null>(null);
