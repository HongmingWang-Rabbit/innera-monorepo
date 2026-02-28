'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactionResponse } from '@innera/shared';
import type { ApiResponse } from '../api/types';
import { useApiClient, useAuth } from '../auth/use-auth';
import { API } from '../api/endpoints';
import { queryKeys } from './query-keys';

export function useReactions(entryId: string) {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useQuery({
    queryKey: queryKeys.reactions.list(entryId),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiResponse<ReactionResponse[]>>(API.reactions.list(entryId), { signal });
      return res.data;
    },
    enabled: !!entryId && status === 'authenticated' && !isGuest,
  });
}

export function useToggleReaction(entryId: string) {
  const api = useApiClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ emoji, existingReactionId }: { emoji: string; existingReactionId?: string }) => {
      if (existingReactionId) {
        // Remove
        await api.delete(API.reactions.delete(entryId, existingReactionId));
        return null;
      }
      // Add
      const res = await api.post<ApiResponse<ReactionResponse>>(
        API.reactions.create(entryId),
        { body: { emoji } },
      );
      return res.data;
    },
    onMutate: async ({ emoji, existingReactionId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reactions.list(entryId) });
      const prev = queryClient.getQueryData<ReactionResponse[]>(queryKeys.reactions.list(entryId));
      if (prev) {
        if (existingReactionId) {
          queryClient.setQueryData(
            queryKeys.reactions.list(entryId),
            prev.filter((r) => r.id !== existingReactionId),
          );
        } else {
          queryClient.setQueryData(queryKeys.reactions.list(entryId), [
            ...prev,
            { id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`, entryId, userId: user?.id ?? 'optimistic', emoji, createdAt: new Date().toISOString() },
          ]);
        }
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.reactions.list(entryId), context.prev);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reactions.list(entryId) });
    },
  });
}
