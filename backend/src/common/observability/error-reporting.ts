import * as Sentry from '@sentry/node';
import type { ErrorEvent, EventHint, NodeOptions } from '@sentry/node';
import { AppError } from '../errors';

/**
 * Crash reports to Sentry, under the same rules as the logs: no request, no
 * user, no breadcrumbs (they carry URLs), and an error's message only when it
 * is one of our own operational errors. A driver error can carry a database
 * address; a validation dump can carry a phone number.
 */
export function scrubEvent(event: ErrorEvent, hint: EventHint): ErrorEvent {
  const original = hint.originalException;
  const keepMessage =
    original instanceof AppError && original.kind === 'operational';
  const values = event.exception?.values?.map((value) => ({
    ...value,
    value: keepMessage ? value.value : '[message withheld]',
  }));
  return {
    ...event,
    request: undefined,
    user: undefined,
    breadcrumbs: undefined,
    extra: undefined,
    // Sentry names it from the raw URL (real ids); the route tag carries the pattern.
    transaction: undefined,
    exception: event.exception ? { ...event.exception, values } : undefined,
  };
}

/** Sentry options, or null when no SENTRY_DSN is set (local dev, tests). */
export function errorReportingOptions(
  env: Record<string, string | undefined>,
): NodeOptions | null {
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return null;
  return {
    dsn,
    environment: env.NODE_ENV ?? 'development',
    release: env.RENDER_GIT_COMMIT,
    // Collect nothing about the request or user; scrubEvent is the second line of defence.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    // Errors only: no tracesSampleRate at all (even 0 loads Sentry's tracing integrations);
    // traces go to OpenTelemetry, which this app sets up itself.
    enableOpenTelemetrySetup: false,
    beforeBreadcrumb: () => null,
    beforeSend: scrubEvent,
  };
}

/** Starts Sentry when a DSN is configured; without one, reportError does nothing. */
export function initErrorReporting(
  env: Record<string, string | undefined>,
): void {
  const options = errorReportingOptions(env);
  if (options) Sentry.init(options);
}

export interface ErrorContext {
  route?: string;
  requestId?: string;
  queue?: string;
  jobId?: string;
}

/** Sends one error to Sentry (a no-op when Sentry was not started). */
export function reportError(err: unknown, context: ErrorContext = {}): void {
  const tags = Object.fromEntries(
    Object.entries(context).filter(([, v]) => v !== undefined),
  );
  Sentry.captureException(err, { tags });
}
