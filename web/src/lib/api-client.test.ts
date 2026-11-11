import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { API, server } from '../test/msw/server';
import { createApiClient } from './api-client';
import { ApiError } from './errors';
import type { TokenStore } from './token-store';

const memoryTokens = (initial: string | null = 'tok'): TokenStore & { value: string | null } => {
  const store = {
    value: initial,
    get: () => store.value,
    set: (t: string) => {
      store.value = t;
    },
    clear: () => {
      store.value = null;
    },
  };
  return store;
};

const ok = (data: unknown, extra: object = {}) =>
  HttpResponse.json({ success: true, data, request_id: 'r', timestamp: 't', ...extra });
const fail = (status: number, code: string, message = 'nope') =>
  HttpResponse.json(
    { success: false, error: { code, message, details: null } },
    { status },
  );

const plant = z.object({ id: z.string(), name: z.string() });

function client(tokens = memoryTokens(), onUnauthorized = vi.fn()) {
  return { api: createApiClient({ baseUrl: API, tokens, onUnauthorized }), tokens, onUnauthorized };
}

describe('api client', () => {
  it('unwraps data from the success envelope', async () => {
    server.use(http.get(`${API}/ledger/plants/p1`, () => ok({ id: 'p1', name: 'Aam' })));
    await expect(client().api.get('/ledger/plants/p1', plant)).resolves.toEqual({
      id: 'p1',
      name: 'Aam',
    });
  });

  it('deletes with an empty 204 response, and still maps errors', async () => {
    let method = '';
    server.use(
      http.delete(`${API}/crops/plan/c1`, ({ request }) => {
        method = request.method;
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete(`${API}/crops/plan/c2`, () => fail(409, 'CROP_HAS_SEASONS')),
    );
    await expect(client().api.remove('/crops/plan/c1')).resolves.toBeUndefined();
    expect(method).toBe('DELETE');
    await expect(client().api.remove('/crops/plan/c2')).rejects.toMatchObject({ code: 'CROP_HAS_SEASONS' });
  });

  it('returns a page from data + pagination', async () => {
    const pagination = { page: 1, page_size: 20, total_items: 1, total_pages: 1, has_next: false, has_previous: false };
    server.use(http.get(`${API}/ledger/plants`, ({ request }) => {
      expect(new URL(request.url).searchParams.get('page')).toBe('2');
      return ok([{ id: 'p1', name: 'Aam' }], { pagination });
    }));
    const page = await client().api.getPage('/ledger/plants', plant, { page: 2 });
    expect(page.items).toHaveLength(1);
    expect(page.pagination.total_items).toBe(1);
  });

  it('maps the error envelope to ApiError with the backend code', async () => {
    server.use(http.get(`${API}/ledger/plants/x`, () => fail(404, 'PLANT_NOT_FOUND', 'Plant not found')));
    await expect(client().api.get('/ledger/plants/x', plant)).rejects.toMatchObject({
      status: 404,
      code: 'PLANT_NOT_FOUND',
      message: 'Plant not found',
    });
  });

  it('reports a response that breaks the contract as CONTRACT_MISMATCH', async () => {
    server.use(http.get(`${API}/ledger/plants/p1`, () => ok({ id: 1 })));
    const err = await client().api.get('/ledger/plants/p1', plant).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('CONTRACT_MISMATCH');
  });

  it('turns a network failure into NETWORK_ERROR', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => HttpResponse.error()));
    await expect(client().api.getPage('/ledger/plants', plant)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('on 401 clears the token and calls onUnauthorized once (Review Focus #1)', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => fail(401, 'UNAUTHORIZED')));
    const { api, tokens, onUnauthorized } = client();
    await expect(api.getPage('/ledger/plants', plant)).rejects.toMatchObject({ status: 401 });
    expect(tokens.value).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('sends the bearer token and a request id', async () => {
    server.use(http.post(`${API}/ledger/plants`, async ({ request }) => {
      expect(request.headers.get('authorization')).toBe('Bearer tok');
      expect(request.headers.get('x-request-id')).toBeTruthy();
      expect(await request.json()).toEqual({ name: 'Aam' });
      return ok({ id: 'p1', name: 'Aam' });
    }));
    await client().api.send('POST', '/ledger/plants', { name: 'Aam' }, plant);
  });

  it('sends no Authorization header when signed out', async () => {
    server.use(http.post(`${API}/auth/request-otp`, ({ request }) => {
      expect(request.headers.get('authorization')).toBeNull();
      return ok('OTP sent successfully');
    }));
    await client(memoryTokens(null)).api.send('POST', '/auth/request-otp', {}, z.string());
  });

  it('a 401 with a non-JSON body (proxy page) still signs out', async () => {
    server.use(http.get(`${API}/ledger/plants`, () => new HttpResponse('<html>401</html>', { status: 401, headers: { 'Content-Type': 'text/html' } })));
    const { api, tokens, onUnauthorized } = client();
    await expect(api.getPage('/ledger/plants', plant)).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(tokens.value).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('still works where crypto.randomUUID is missing (plain-http LAN testing)', async () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      server.use(http.get(`${API}/ledger/plants/p1`, ({ request }) => {
        expect(request.headers.get('x-request-id')).toBeTruthy();
        return ok({ id: 'p1', name: 'Aam' });
      }));
      await expect(client().api.get('/ledger/plants/p1', plant)).resolves.toEqual({ id: 'p1', name: 'Aam' });
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true });
    }
  });

  it('works with a relative base URL, as the deployed web app uses (/api/v1 behind the Vercel rewrite)', async () => {
    const seen: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      seen.push(String(input));
      return new Response(JSON.stringify({ success: true, data: { id: 'p1', name: 'Aam' } }), {
        headers: { 'content-type': 'application/json' },
      });
    });
    const api = createApiClient({ baseUrl: '/api/v1', tokens: memoryTokens(), onUnauthorized: vi.fn(), fetchImpl });
    await expect(api.get('/ledger/plants/p1', plant, { page: 2 })).resolves.toEqual({ id: 'p1', name: 'Aam' });
    expect(seen[0]).toBe(`${window.location.origin}/api/v1/ledger/plants/p1?page=2`);
  });
});
