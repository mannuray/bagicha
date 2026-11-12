import { AppError } from '../errors';
import { routePattern } from '../http/route-pattern';

/**
 * How an error reaches a log line: its type, code/reason and stack frames — but its
 * message only when it is one of our own operational errors. A database driver
 * error can carry the connection string; Nest's 404 text carries the URL.
 */
export function safeErr(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) return { type: typeof err };
  const out: Record<string, unknown> = {
    type: err.constructor?.name ?? err.name,
  };
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string') out.code = code;
  if (err instanceof AppError) {
    out.reason = err.reason;
    if (err.kind === 'operational') out.message = err.message;
  }
  // The stack's first line repeats the message; keep only the frames.
  if (err.stack) out.stack = err.stack.split('\n').slice(1).join('\n');
  return out;
}

/** The access line's request: method and route pattern only (no URL, query, headers or IP). */
export function safeReq(
  req: { method?: string; raw?: unknown } & Record<string, unknown>,
): Record<string, unknown> {
  const raw = (req.raw ?? req) as {
    method?: string;
    route?: unknown;
    baseUrl?: string;
  };
  return {
    method: raw.method ?? req.method,
    route: routePattern(raw as never),
  };
}

/** The access line's response: its status only. */
export function safeRes(res: { statusCode?: number }): Record<string, unknown> {
  return { status: res.statusCode };
}
