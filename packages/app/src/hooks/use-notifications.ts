'use client';

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { NotificationResponse } from '@innera/shared';
import type { ApiResponse, ApiPaginatedResponse } from '../api/types';
import { useApiClient, useAuth } from '../auth/use-auth';
import { API } from '../api/endpoints';
import { queryKeys } from './query-keys';

const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

export function useNotifications(limit = 20) {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list({ limit }),
    queryFn: async ({ pageParam, signal }) => {
      const res = await api.get<ApiPaginatedResponse<NotificationResponse>>(API.notifications.list, {
        query: { limit, ...(pageParam ? { cursor: pageParam } : {}) },
        signal,
      });
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.nextCursor ?? undefined) : undefined,
    enabled: status === 'authenticated' && !isGuest,
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useUnreadCount() {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiResponse<{ count: number }>>(API.notifications.unreadCount, { signal });
      return res.data.count;
    },
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    enabled: status === 'authenticated' && !isGuest,
  });
}

export function useMarkRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(API.notifications.markRead(id));
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post(API.notifications.markAllRead);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
