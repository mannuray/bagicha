import { z } from 'zod';
import { ApiError } from './errors';
import { reportError } from './report-error';
import type { TokenStore } from './token-store';

export interface PageMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface Page<T> {
  items: T[];
  pagination: PageMeta;
}

type Query = Record<string, string | number | undefined>;

export interface ApiClient {
  get<T>(path: string, schema: z.ZodType<T>, query?: Query): Promise<T>;
  getPage<T>(path: string, item: z.ZodType<T>, query?: Query): Promise<Page<T>>;
  send<T>(method: 'POST' | 'PUT', path: string, body: unknown, schema: z.ZodType<T>): Promise<T>;
  upload<T>(path: string, form: FormData, schema: z.ZodType<T>): Promise<T>;
  /** DELETE; the backend answers 204 with no body. */
  remove(path: string): Promise<void>;
}

export interface ApiClientOptions {
  baseUrl: string;
  tokens: TokenStore;
  onUnauthorized: () => void;
  fetchImpl?: typeof fetch;
  /** Give up after this long. Long enough for the free Render plan to wake (~45 s). */
  timeoutMs?: number;
  /** A request still waiting after this long counts as slow. */
  slowAfterMs?: number;
  /** True when the first request turns slow, false when the last slow one ends. */
  onSlow?: (slow: boolean) => void;
  /** Where unexpected failures are reported (default: lib/report-error). */
  report?: (err: unknown, context: Record<string, unknown>) => void;
}

export const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_SLOW_AFTER_MS = 4_000;

const pageMetaSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  total_items: z.number(),
  total_pages: z.number(),
  has_next: z.boolean(),
  has_previous: z.boolean(),
});

const errorEnvelope = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

const successEnvelope = z.object({
  success: z.literal(true),
  data: z.unknown(),
  pagination: pageMetaSchema.optional(),
});

/** crypto.randomUUID only exists on secure origins; a phone on plain-http LAN has getRandomValues. */
function requestId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** One typed client for the backend: unwraps the envelope, validates with zod, maps errors. */
export function createApiClient(opts: ApiClientOptions): ApiClient {
  const doFetch = opts.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const report = opts.report ?? reportError;

  function contractError(status: number, path: string, cause: unknown): ApiError {
    report(cause, { path, kind: 'contract' });
    return new ApiError(status, 'CONTRACT_MISMATCH', `Unexpected response from ${path}`, cause);
  }
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const slowAfterMs = opts.slowAfterMs ?? DEFAULT_SLOW_AFTER_MS;
  let slowCount = 0;

  /** Fetches with a timeout, telling onSlow while any request is taking long. */
  async function timedFetch(url: URL, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let slow = false;
    const slowTimer = setTimeout(() => {
      slow = true;
      if (slowCount++ === 0) opts.onSlow?.(true);
    }, slowAfterMs);
    try {
      return await doFetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      throw controller.signal.aborted
        ? new ApiError(0, 'TIMEOUT', 'The server took too long to answer', err)
        : new ApiError(0, 'NETWORK_ERROR', 'Network request failed', err);
    } finally {
      clearTimeout(timeout);
      clearTimeout(slowTimer);
      if (slow && --slowCount === 0) opts.onSlow?.(false);
    }
  }

  async function request(path: string, init: RequestInit, query?: Query) {
    // A relative base ("/api/v1", the deployed app behind the Vercel rewrite) resolves
    // against this page's origin; an absolute one (local dev, tests) is used as is.
    const url = new URL(opts.baseUrl + path, globalThis.location?.origin ?? 'http://localhost');
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers = new Headers(init.headers);
    headers.set('X-Request-Id', requestId());
    const token = opts.tokens.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await timedFetch(url, { ...init, headers });

    // Fail closed on auth before anything can go wrong reading the body.
    if (response.status === 401) {
      opts.tokens.clear();
      opts.onUnauthorized();
    }

    if (response.status === 204) return { status: 204, data: undefined, pagination: undefined };

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw response.status === 401
        ? new ApiError(401, 'UNAUTHORIZED', response.statusText)
        : new ApiError(response.status, 'BAD_RESPONSE', 'The server sent an unreadable response');
    }

    if (!response.ok) {
      const parsed = errorEnvelope.safeParse(body);
      throw parsed.success
        ? new ApiError(response.status, parsed.data.error.code, parsed.data.error.message, parsed.data.error.details)
        : new ApiError(response.status, response.status === 401 ? 'UNAUTHORIZED' : 'BAD_RESPONSE', response.statusText);
    }

    const parsed = successEnvelope.safeParse(body);
    if (!parsed.success) throw contractError(response.status, path, parsed.error);
    return { status: response.status, data: parsed.data.data, pagination: parsed.data.pagination };
  }

  function validate<T>(schema: z.ZodType<T>, value: unknown, status: number, path: string): T {
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw contractError(status, path, parsed.error);
    return parsed.data;
  }

  return {
    async get(path, schema, query) {
      const res = await request(path, { method: 'GET' }, query);
      return validate(schema, res.data, res.status, path);
    },
    async getPage(path, item, query) {
      const res = await request(path, { method: 'GET' }, query);
      if (!res.pagination) {
        throw contractError(res.status, path, new Error('missing pagination'));
      }
      return { items: validate(z.array(item), res.data, res.status, path), pagination: res.pagination };
    },
    async send(method, path, body, schema) {
      const res = await request(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return validate(schema, res.data, res.status, path);
    },
    async remove(path) {
      await request(path, { method: 'DELETE' });
    },
    async upload(path, form, schema) {
      const res = await request(path, { method: 'POST', body: form });
      return validate(schema, res.data, res.status, path);
    },
  };
}
