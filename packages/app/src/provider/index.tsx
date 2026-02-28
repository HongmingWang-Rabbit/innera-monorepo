'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, config } from '@innera/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../auth/auth-provider';
import { createQueryClient } from './query-client';

type ThemePref = 'light' | 'dark' | 'system';
interface ThemeContextValue {
  preference: ThemePref;
  resolved: 'light' | 'dark';
  setPreference: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  resolved: 'light',
  setPreference: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const systemScheme = useColorScheme();
  const [preference, setPreferenceRaw] = useState<ThemePref>('system');
  // Delay reading systemScheme until after hydration to avoid server/client mismatch.
  // Server has no window.matchMedia so useColorScheme returns null → 'light',
  // but client may detect 'dark'. Using a mounted flag ensures both render 'light'
  // on the initial pass, then the client updates after mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setPreference = useCallback((pref: ThemePref) => {
    setPreferenceRaw(pref);
  }, []);

  const resolved = preference === 'system'
    ? (mounted && systemScheme === 'dark' ? 'dark' : 'light')
    : preference;

  const themeValue = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <TamaguiProvider config={config} defaultTheme={resolved}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </TamaguiProvider>
    </ThemeContext.Provider>
  );
}
