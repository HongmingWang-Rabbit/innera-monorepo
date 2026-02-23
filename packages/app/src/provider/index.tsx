import React from 'react';
import { TamaguiProvider, config } from '@innera/ui';

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {children}
    </TamaguiProvider>
  );
}
