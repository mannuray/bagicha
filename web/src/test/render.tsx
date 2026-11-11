import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { createApiClient } from '../lib/api-client';
import { ApiProvider } from '../lib/api';
import { createQueryClient } from '../lib/query-client';
import type { TokenStore } from '../lib/token-store';
import { createSessionStore, SessionProvider, type SessionStore, type User } from '../features/auth';
import { API } from './msw/server';
import { testFetch } from './node-fetch';

export function memoryTokenStore(initial: string | null = 'test-token'): TokenStore {
  let value = initial;
  return {
    get: () => value,
    set: (t) => {
      value = t;
    },
    clear: () => {
      value = null;
    },
  };
}

export const testUser = (over: Partial<User> = {}): User => ({
  id: 'u1',
  phone_number: '+919876543210',
  name: 'Asha',
  district: 'Patna',
  region_cluster: 'EAST_INDIA',
  garden_types: ['trees'],
  language_pref: 'en',
  subscription_tier: 'FREE',
  premium_expires_at: null,
  badge_level: 'Seedling',
  avatar_key: null,
  ...over,
});

export interface TestAppOptions {
  route?: string | { pathname: string; state?: unknown };
  user?: User | null;
}

export function createTestSession(user: User | null = testUser()): SessionStore {
  const store = createSessionStore(memoryTokenStore(user ? 'test-token' : null));
  if (user) store.signIn('test-token', user);
  return store;
}

/** Providers every screen needs, wired to the MSW test API and an in-memory session. */
export function TestProviders({
  children,
  route = '/',
  session,
}: { children: ReactNode; route?: TestAppOptions['route']; session: SessionStore }) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  const api = createApiClient({
    baseUrl: API,
    tokens: session.tokens,
    onUnauthorized: () => session.expire(),
    fetchImpl: testFetch,
  });
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={api}>
        <SessionProvider store={session}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </SessionProvider>
      </ApiProvider>
    </QueryClientProvider>
  );
}

export function renderWithApp(
  ui: ReactElement,
  options: TestAppOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { route, user = testUser(), ...rest } = options;
  const session = createTestSession(user);
  const result = render(ui, {
    wrapper: ({ children }) => (
      <TestProviders route={route} session={session}>
        {children}
      </TestProviders>
    ),
    ...rest,
  });
  return { ...result, session };
}
