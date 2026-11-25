import * as Sentry from '@sentry/react';
import type { ErrorEvent } from '@sentry/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorReportingOptions, reportError, scrubEvent } from './report-error';

vi.mock('@sentry/react', () => ({ captureException: vi.fn(), init: vi.fn() }));

afterEach(() => vi.mocked(Sentry.captureException).mockClear());

function event(): ErrorEvent {
  return {
    type: undefined,
    request: {
      url: 'https://bagicha-web.vercel.app/plants/abc?phone=%2B919812345678#x',
      headers: { 'User-Agent': 'x' },
      cookies: { a: 'b' },
      query_string: 'phone=%2B919812345678',
    },
    user: { id: 'u1', ip_address: '{{auto}}' },
    breadcrumbs: [{ category: 'fetch', data: { url: '/api/v1/user/profile' } }],
    tags: { area: 'plants' },
  } as ErrorEvent;
}

describe('scrubEvent', () => {
  it('drops the user, breadcrumbs, headers, cookies and query string', () => {
    const out = scrubEvent(event());
    expect(out.user).toBeUndefined();
    expect(out.breadcrumbs).toBeUndefined();
    expect(out.request?.headers).toBeUndefined();
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.query_string).toBeUndefined();
    expect(JSON.stringify(out)).not.toContain('919812345678');
  });

  it('keeps the page path without its query or hash, and keeps tags', () => {
    const out = scrubEvent(event());
    expect(out.request?.url).toBe('https://bagicha-web.vercel.app/plants/abc');
    expect(out.tags).toEqual({ area: 'plants' });
  });
});

describe('errorReportingOptions', () => {
  it('is off without a DSN', () => {
    expect(errorReportingOptions({ dsn: undefined, mode: 'production' })).toBeNull();
    expect(errorReportingOptions({ dsn: ' ', mode: 'production' })).toBeNull();
  });

  it('sends errors only, with no personal data or breadcrumbs', () => {
    const opts = errorReportingOptions({
      dsn: 'https://k@o1.ingest.sentry.io/3',
      mode: 'production',
      release: 'abc123',
    });
    expect(opts).toMatchObject({
      dsn: 'https://k@o1.ingest.sentry.io/3',
      environment: 'production',
      release: 'abc123',
      tracesSampleRate: 0,
    });
    expect(opts?.dataCollection).toMatchObject({ userInfo: false, cookies: false });
    expect(opts?.beforeBreadcrumb?.({ message: 'x' }, {})).toBeNull();
    expect(opts?.beforeSend).toBe(scrubEvent);
  });
});

describe('reportError', () => {
  it('sends the error with its context as extra data', () => {
    const err = new Error('boom');
    reportError(err, { componentStack: 'at Plant' });
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      extra: { componentStack: 'at Plant' },
    });
  });
});
