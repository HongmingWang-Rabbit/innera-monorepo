import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry(failureCount, error) {
          // Don't retry on 4xx errors
          if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }
          return failureCount < 3;
        },
        // refetchOnWindowFocus defaults to true (React Query default) — keep it
        // enabled so data stays fresh when the user returns to the app.
      },
      mutations: {
        retry: false,
      },
    },
  });
}
