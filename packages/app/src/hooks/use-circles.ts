'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateCircleInput, CircleResponse } from '@innera/shared';
import type { ApiResponse } from '../api/types';
import { useApiClient, useAuth } from '../auth/use-auth';
import { API } from '../api/endpoints';
import { queryKeys } from './query-keys';

type CircleWithMeta = CircleResponse & {
  memberCount: number;
};

export function useCircles() {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useQuery({
    queryKey: queryKeys.circles.lists(),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiResponse<CircleWithMeta[]>>(API.circles.list, { signal });
      return res.data;
    },
    enabled: status === 'authenticated' && !isGuest,
  });
}

export function useCircle(id: string | undefined) {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useQuery({
    queryKey: queryKeys.circles.detail(id ?? ''),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('Circle ID required');
      const res = await api.get<ApiResponse<CircleWithMeta>>(API.circles.detail(id), { signal });
      return res.data;
    },
    enabled: !!id && status === 'authenticated' && !isGuest,
  });
}

export function useCreateCircle() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCircleInput) => {
      const res = await api.post<ApiResponse<CircleWithMeta>>(API.circles.create, { body: input });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.circles.lists() });
    },
  });
}

export function useJoinCircle() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { inviteCode: string; historyPolicy: 'ALL' | 'FUTURE_ONLY' }) => {
      const res = await api.post<ApiResponse<CircleWithMeta>>(API.circles.join, { body: input });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.circles.lists() });
    },
  });
}

export function useLeaveCircle() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (circleId: string) => {
      await api.post(API.circles.leave(circleId));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.circles.all });
    },
  });
}
