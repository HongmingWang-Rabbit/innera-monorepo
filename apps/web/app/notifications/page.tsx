'use client';
import { NotificationsScreen, RequireAuth } from '@innera/app';
export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsScreen />
    </RequireAuth>
  );
}
