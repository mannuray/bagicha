import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router';
import { createSessionStore, SessionProvider } from '../features/auth';
import { createApiClient } from '../lib/api-client';
import { ApiProvider } from '../lib/api';
import { createQueryClient } from '../lib/query-client';
import { localTokenStore } from '../lib/token-store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

/** Builds the app's long-lived services once and wires the 401 → sign-out path. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [services] = useState(() => {
    const session = createSessionStore(localTokenStore);
    const queryClient = createQueryClient();
    const api = createApiClient({ baseUrl: API_URL, tokens: localTokenStore, onUnauthorized: () => session.expire() });
    return { session, queryClient, api };
  });

  // Never show one user's cached data to the next.
  useEffect(
    () =>
      services.session.subscribe(() => {
        if (!services.session.get().user) services.queryClient.clear();
      }),
    [services],
  );

  return (
    <QueryClientProvider client={services.queryClient}>
      <ApiProvider client={services.api}>
        <SessionProvider store={services.session}>
          <BrowserRouter>{children}</BrowserRouter>
        </SessionProvider>
      </ApiProvider>
    </QueryClientProvider>
  );
}
