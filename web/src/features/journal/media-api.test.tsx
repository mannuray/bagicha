import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ok } from '../../test/fixtures';
import { API, server } from '../../test/msw/server';
import { createTestSession, TestProviders } from '../../test/render';
import { useMediaUrl } from './media-api';

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestProviders session={createTestSession()}>{children}</TestProviders>
);

describe('media api', () => {
  it('fetches a signed URL for a key, and nothing for no key', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/media/download-url/*`, () => {
        calls += 1;
        return HttpResponse.json(ok({ url: 'http://signed', expires_in_seconds: 3600 }));
      }),
    );
    const none = renderHook(() => useMediaUrl(null), { wrapper });
    const some = renderHook(() => useMediaUrl('journal/u1/k.jpg'), { wrapper });
    await waitFor(() => expect(some.result.current.data).toBe('http://signed'));
    expect(none.result.current.fetchStatus).toBe('idle');
    expect(calls).toBe(1);
  });
});
