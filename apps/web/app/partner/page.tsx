'use client';
import { PartnerScreen, RequireAuth } from '@innera/app';
export default function PartnerPage() {
  return (
    <RequireAuth>
      <PartnerScreen />
    </RequireAuth>
  );
}
