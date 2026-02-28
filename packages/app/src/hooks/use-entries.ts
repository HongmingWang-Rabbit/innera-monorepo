'use client';

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { EntryResponse, CreateEntryInput, UpdateEntryInput } from '@innera/shared';
import type { ApiResponse, ApiPaginatedResponse } from '../api/types';
import { useApiClient, useAuth } from '../auth/use-auth';
import { API } from '../api/endpoints';
import { queryKeys } from './query-keys';

export function useInfiniteEntries(limit = 20) {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useInfiniteQuery({
    queryKey: queryKeys.entries.list({ limit }),
    queryFn: async ({ pageParam, signal }) => {
      const res = await api.get<ApiPaginatedResponse<EntryResponse>>(API.entries.list, {
        query: { limit, ...(pageParam ? { cursor: pageParam } : {}) },
        signal,
      });
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.nextCursor ?? undefined) : undefined,
    enabled: status === 'authenticated' && !isGuest,
  });
}

export function useEntry(id: string | undefined) {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useQuery({
    queryKey: queryKeys.entries.detail(id ?? ''),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('Entry ID required');
      const res = await api.get<ApiResponse<EntryResponse>>(API.entries.detail(id), { signal });
      return res.data;
    },
    enabled: !!id && status === 'authenticated' && !isGuest,
  });
}

export function useCreateEntry() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEntryInput) => {
      const res = await api.post<ApiResponse<EntryResponse>>(API.entries.create, { body: input });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entries.lists() });
    },
  });
}

export function useUpdateEntry() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateEntryInput & { id: string }) => {
      const res = await api.patch<ApiResponse<EntryResponse>>(API.entries.update(id), { body: input });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.entries.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.entries.lists() });
    },
  });
}

export function useDeleteEntry() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(API.entries.delete(id));
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.entries.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.entries.lists() });
    },
  });
}
