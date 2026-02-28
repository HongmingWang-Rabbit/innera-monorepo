'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CommentResponse } from '@innera/shared';
import type { ApiResponse, ApiPaginatedResponse } from '../api/types';
import { useApiClient, useAuth } from '../auth/use-auth';
import { API } from '../api/endpoints';
import { queryKeys } from './query-keys';

export function useComments(entryId: string, limit = 20) {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useInfiniteQuery({
    queryKey: [...queryKeys.comments.list(entryId), { limit }],
    queryFn: async ({ pageParam, signal }) => {
      const res = await api.get<ApiPaginatedResponse<CommentResponse>>(API.comments.list(entryId), {
        query: { limit, ...(pageParam ? { cursor: pageParam } : {}) },
        signal,
      });
      return res;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.nextCursor ?? undefined) : undefined,
    enabled: !!entryId && status === 'authenticated' && !isGuest,
  });
}

export function useCreateComment(entryId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentEncrypted: string) => {
      const res = await api.post<ApiResponse<CommentResponse>>(
        API.comments.create(entryId),
        { body: { contentEncrypted } },
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(entryId) });
    },
  });
}

export function useDeleteComment(entryId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(API.comments.delete(entryId, commentId));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(entryId) });
    },
  });
}
