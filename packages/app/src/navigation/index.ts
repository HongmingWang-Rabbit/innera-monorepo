export { useParams, useLink, useRouter } from 'solito/navigation';

export const Routes = {
  Home: '/',
  Entry: '/entry/[id]',
  NewEntry: '/entry/new',
  Partner: '/partner',
  Circles: '/circles',
  CircleDetail: '/circles/[id]',
  Settings: '/settings',
  Profile: '/profile',
  Login: '/login',
  Notifications: '/notifications',
} as const;

export type RoutePath = (typeof Routes)[keyof typeof Routes];

export type ScreenParams = {
  Home: Record<string, never>;
  Entry: { id: string };
  NewEntry: Record<string, never>;
  Partner: Record<string, never>;
  Circles: Record<string, never>;
  CircleDetail: { id: string };
  Settings: Record<string, never>;
  Profile: Record<string, never>;
  Login: Record<string, never>;
  Notifications: Record<string, never>;
};
