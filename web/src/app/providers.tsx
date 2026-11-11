import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router';
import { z } from 'zod';
import { createSessionStore, SessionProvider } from '../features/auth';
import { createApiClient } from '../lib/api-client';
import { ApiProvider } from '../lib/api';
import { createQueryClient } from '../lib/query-client';
import { clearOnUserChange, createSessionOnce, SessionOnceProvider } from '../lib/session-once';
import { localTokenStore } from '../lib/token-store';
import { ServerWakeBanner } from './server-wake';
import { createServerWake } from './server-wake-store';
import { APP_TABS } from './nav-tabs';
import { NavTabsProvider } from '../ui';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

/** Builds the app's long-lived services once and wires the 401 → sign-out path. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [services] = useState(() => {
    const session = createSessionStore(localTokenStore);
    const queryClient = createQueryClient();
    const wake = createServerWake();
    const once = createSessionOnce();
    clearOnUserChange(session, once);
    const api = createApiClient({
      baseUrl: API_URL,
      tokens: localTokenStore,
      onUnauthorized: () => session.expire(),
      onSlow: wake.set,
    });
    return { session, queryClient, api, wake, once };
  });

  // Wake the server (asleep on the free Render plan) while the splash and login show.
  useEffect(() => {
    services.api.get('/health/live', z.unknown()).catch(() => undefined);
  }, [services]);

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
          <ServerWakeBanner wake={services.wake} />
          <SessionOnceProvider value={services.once}>
            <NavTabsProvider value={APP_TABS}>
              <BrowserRouter>{children}</BrowserRouter>
            </NavTabsProvider>
          </SessionOnceProvider>
        </SessionProvider>
      </ApiProvider>
    </QueryClientProvider>
  );
}
