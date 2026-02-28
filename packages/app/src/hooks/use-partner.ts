'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PartnerLinkResponse } from '@innera/shared';
import type { ApiResponse } from '../api/types';
import { useApiClient, useAuth } from '../auth/use-auth';
import { API } from '../api/endpoints';
import { queryKeys } from './query-keys';

export type PartnerLinkWithPartner = PartnerLinkResponse & {
  role: 'initiator' | 'partner';
  initiatedAt: string;
  partner: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

export function usePartner() {
  const api = useApiClient();
  const { isGuest, status } = useAuth();

  return useQuery({
    queryKey: queryKeys.partner.current(),
    queryFn: async ({ signal }) => {
      const res = await api.get<ApiResponse<PartnerLinkWithPartner | null>>(API.partner.get, { signal });
      return res.data;
    },
    enabled: status === 'authenticated' && !isGuest,
  });
}

export function useCreateInvite() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ inviteCode: string; expiresIn: number }>>(API.partner.invite);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.partner.all });
    },
  });
}

export function useAcceptInvite() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post<ApiResponse<PartnerLinkWithPartner>>(API.partner.acceptInvite(code));
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.partner.all });
    },
  });
}

export function useRespondToPartner() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accept: boolean) => {
      const res = await api.post<ApiResponse<PartnerLinkWithPartner>>(API.partner.respond, {
        body: { accept },
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.partner.all });
    },
  });
}

export function useDisconnectPartner() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(API.partner.delete);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.partner.all });
    },
  });
}
