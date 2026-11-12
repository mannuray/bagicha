import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import '../lib/i18n';
import { server } from './msw/server';

// The full suite runs files in parallel; a screen's first render (lazy chunks,
// i18n) can exceed the 1 s default under that load and fail a correct test.
configure({ asyncUtilTimeout: 3000 });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  globalThis.localStorage?.clear();
});
afterAll(() => server.close());
