import * as Sentry from '@sentry/node';
import type { ErrorEvent, EventHint } from '@sentry/node';
import { NotFoundError } from '../errors';
import {
  errorReportingOptions,
  reportError,
  scrubEvent,
} from './error-reporting';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

function event(): ErrorEvent {
  return {
    type: undefined,
    exception: {
      values: [
        {
          type: 'PrismaClientKnownRequestError',
          value:
            'connect to postgres://bagicha:secret@host/db failed for +919812345678',
          stacktrace: { frames: [{ function: 'query' }] },
        },
      ],
    },
    request: {
      url: 'https://api/ledger/plants/123?x=1',
      headers: { authorization: 'Bearer abc' },
      data: '{"phone_number":"+919812345678"}',
      cookies: { a: 'b' },
    },
    user: { id: 'u1', ip_address: '1.2.3.4', email: 'a@b.c' },
    breadcrumbs: [{ message: 'GET /ledger/plants/123' }],
    extra: { body: { phone_number: '+919812345678' } },
    contexts: { trace: { trace_id: 't1', span_id: 's1' } },
    tags: { route: '/ledger/plants/:id' },
    transaction: 'GET /api/v1/ledger/plants/3f1c',
  } as ErrorEvent;
}

describe('scrubEvent', () => {
  it('drops the request, user, breadcrumbs, extra data and the raw transaction URL', () => {
    const out = scrubEvent(event(), {});
    expect(out.transaction).toBeUndefined();
    expect(out.request).toBeUndefined();
    expect(out.user).toBeUndefined();
    expect(out.breadcrumbs).toBeUndefined();
    expect(out.extra).toBeUndefined();
  });

  it('withholds the message of an unknown error: it can carry a DB address or phone number', () => {
    const out = scrubEvent(event(), { originalException: new Error('x') });
    const value = out.exception?.values?.[0];
    expect(value?.type).toBe('PrismaClientKnownRequestError');
    expect(value?.value).toBe('[message withheld]');
    expect(value?.stacktrace?.frames).toHaveLength(1);
    expect(JSON.stringify(out)).not.toContain('+919812345678');
    expect(JSON.stringify(out)).not.toContain('secret');
  });

  it('keeps the message of our own operational error', () => {
    const e = event();
    e.exception!.values![0].value = 'Plant not found';
    const hint: EventHint = {
      originalException: new NotFoundError(
        'PLANT_NOT_FOUND',
        'Plant not found',
      ),
    };
    expect(scrubEvent(e, hint).exception?.values?.[0].value).toBe(
      'Plant not found',
    );
  });

  it('keeps tags and trace ids so a report can be matched to its log line', () => {
    const out = scrubEvent(event(), {});
    expect(out.tags).toEqual({ route: '/ledger/plants/:id' });
    expect(out.contexts?.trace).toEqual({ trace_id: 't1', span_id: 's1' });
  });
});

describe('errorReportingOptions', () => {
  it('is off without a DSN', () => {
    expect(errorReportingOptions({})).toBeNull();
    expect(errorReportingOptions({ SENTRY_DSN: '  ' })).toBeNull();
  });

  it('sends no personal data, no breadcrumbs and no traces, and registers no OpenTelemetry provider of its own', () => {
    const opts = errorReportingOptions({
      SENTRY_DSN: 'https://k@o1.ingest.sentry.io/2',
      NODE_ENV: 'production',
      RENDER_GIT_COMMIT: 'abc123',
    });
    expect(opts).toMatchObject({
      dsn: 'https://k@o1.ingest.sentry.io/2',
      environment: 'production',
      release: 'abc123',
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
      },
      enableOpenTelemetrySetup: false,
    });
    expect(opts?.beforeBreadcrumb?.({ message: 'x' }, {})).toBeNull();
    expect(opts?.beforeSend).toBe(scrubEvent);
  });

  it('leaves tracing off entirely (a rate of 0 would still load tracing integrations)', () => {
    const opts = errorReportingOptions({
      SENTRY_DSN: 'https://k@o1.ingest.sentry.io/2',
    });
    expect(opts).not.toHaveProperty('tracesSampleRate');
    expect(opts).not.toHaveProperty('tracesSampler');
  });
});

describe('reportError', () => {
  it('sends the error with its context as tags', () => {
    const err = new Error('boom');
    reportError(err, { route: '/x', requestId: 'r1' });
    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      tags: { route: '/x', requestId: 'r1' },
    });
  });
});
