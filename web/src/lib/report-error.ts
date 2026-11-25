import * as Sentry from '@sentry/react';
import type { BrowserOptions, ErrorEvent } from '@sentry/react';

/**
 * Crash reports carry no user, headers, cookies or breadcrumbs (they list the
 * API calls made), and the page URL loses its query and hash.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const request = event.request
    ? { url: event.request.url?.split(/[?#]/)[0] }
    : undefined;
  return { ...event, user: undefined, breadcrumbs: undefined, request };
}

/** Sentry options, or null when no DSN is configured (local dev, tests). */
export function errorReportingOptions(config: {
  dsn: string | undefined;
  mode: string;
  release?: string;
}): BrowserOptions | null {
  const dsn = config.dsn?.trim();
  if (!dsn) return null;
  return {
    dsn,
    environment: config.mode,
    release: config.release,
    tracesSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    beforeBreadcrumb: () => null,
    beforeSend: scrubEvent,
  };
}

/** Starts Sentry when VITE_SENTRY_DSN is set at build time. */
export function initErrorReporting(): void {
  const options = errorReportingOptions({
    dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
    mode: import.meta.env.MODE,
    release: import.meta.env.VITE_RELEASE as string | undefined,
  });
  if (options) Sentry.init(options);
}

/** The one place errors are reported: Sentry (a no-op until started), plus the console in development. */
export function reportError(err: unknown, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error('[bagicha]', err, context ?? {});
  }
  Sentry.captureException(err, { extra: context });
}
