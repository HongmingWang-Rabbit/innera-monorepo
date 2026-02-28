'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateSettingsInput, UpdateUserInput, SettingsResponse, UserResponse } from '@innera/shared';
import type { ApiResponse } from '../api/types';
import { useApiClient, useAuth } from '../auth/use-auth';
import { API } from '../api/endpoints';
import { queryKeys } from './query-keys';

export function useSettings() {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiResponse<SettingsResponse>>(API.settings.get, { signal });
      return res.data;
    },
    enabled: status === 'authenticated' && !isGuest,
  });
}

export function useUpdateSettings() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const res = await api.patch<ApiResponse<SettingsResponse>>(API.settings.update, { body: input });
      return res.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.all });
      const prev = queryClient.getQueryData<SettingsResponse>(queryKeys.settings.all);
      if (prev) {
        queryClient.setQueryData(queryKeys.settings.all, { ...prev, ...input });
      }
      return { prev };
    },
    onError: (_err, _input, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.settings.all, context.prev);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });
}

export function useUpdateUser() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const res = await api.patch<ApiResponse<UserResponse>>(API.users.updateMe, { body: input });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
  });
}
