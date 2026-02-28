export * from './components';
export * from './constants';
export * from './screens/HomeScreen';
export * from './screens/EntryDetailScreen';
export * from './screens/NewEntryScreen';
export * from './screens/LoginScreen';
export * from './screens/SettingsScreen';
export * from './screens/PartnerScreen';
export * from './screens/CirclesScreen';
export * from './screens/NotificationsScreen';
export * from './navigation';
export * from './provider';

// API client
export { createApiClient, ApiError } from './api/client';
export type { ApiClient, ApiClientConfig } from './api/client';
export { API } from './api/endpoints';
export { API_BASE_URL } from './api/config';

// Auth
export { AuthProvider } from './auth/auth-provider';
export { AuthContext, ApiClientContext } from './auth/auth-context';
export type { AuthUser, AuthState, AuthActions, AuthStatus } from './auth/auth-context';
export { useAuth, useApiClient } from './auth/use-auth';

// Hooks
export { queryKeys } from './hooks/query-keys';
export { useInfiniteEntries, useEntry, useCreateEntry, useUpdateEntry, useDeleteEntry } from './hooks/use-entries';
export { useSettings, useUpdateSettings, useUpdateUser } from './hooks/use-settings';
export { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from './hooks/use-notifications';
export { usePartner, useCreateInvite, useAcceptInvite, useRespondToPartner, useDisconnectPartner } from './hooks/use-partner';
export { useCircles, useCircle, useCreateCircle, useJoinCircle, useLeaveCircle } from './hooks/use-circles';
export { useComments, useCreateComment, useDeleteComment } from './hooks/use-comments';
export { useReactions, useToggleReaction } from './hooks/use-reactions';

// Utils
export { decodeBase64, encodeBase64 } from './utils/crypto';
export { formatRelativeTime, isToday, getGreeting, formatDate } from './utils/format';

// API types
export type { ApiResponse, ApiPaginatedResponse } from './api/types';
