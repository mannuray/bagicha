import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './errors';

/** Retries only failures that can succeed on retry (network, 5xx), never 4xx. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, err) =>
          count < 2 && (!isApiError(err) || err.status === 0 || err.status >= 500),
      },
      mutations: { retry: false },
    },
  });
}
