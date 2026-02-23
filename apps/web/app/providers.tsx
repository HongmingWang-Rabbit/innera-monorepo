'use client';

import React from 'react';
import { Provider } from '@innera/app';

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
