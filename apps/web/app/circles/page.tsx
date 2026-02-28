'use client';
import { CirclesScreen, RequireAuth } from '@innera/app';
export default function CirclesPage() {
  return (
    <RequireAuth>
      <CirclesScreen />
    </RequireAuth>
  );
}
