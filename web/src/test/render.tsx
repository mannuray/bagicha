import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { createApiClient } from '../lib/api-client';
import { ApiProvider } from '../lib/api';
import { createQueryClient } from '../lib/query-client';
import type { TokenStore } from '../lib/token-store';
import { API } from './msw/server';

export interface TestAppOptions {
  route?: string;
  token?: string | null;
  onUnauthorized?: () => void;
}

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

/** Providers every screen needs, wired to the MSW test API. */
export function TestProviders({
  children,
  route = '/',
  token = 'test-token',
  onUnauthorized = () => {},
}: TestAppOptions & { children: ReactNode }) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  const api = createApiClient({ baseUrl: API, tokens: memoryTokenStore(token), onUnauthorized });
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={api}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </ApiProvider>
    </QueryClientProvider>
  );
}

export function renderWithApp(
  ui: ReactElement,
  options: TestAppOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { route, token, onUnauthorized, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders route={route} token={token} onUnauthorized={onUnauthorized}>
        {children}
      </TestProviders>
    ),
    ...rest,
  });
}
