'use client';

import { useContext } from 'react';
import { AuthContext, ApiClientContext } from './auth-context';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useApiClient() {
  const client = useContext(ApiClientContext);
  if (!client) throw new Error('useApiClient must be used within AuthProvider');
  return client;
}
