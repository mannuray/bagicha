import { AppError } from '../errors';

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

/**
 * A request in a log line: its method only (no URL, query, headers or IP). The route
 * pattern is added when the request finishes (customProps): pino binds `req` at the
 * start, before routing, when only the catch-all middleware route is known.
 */
export function safeReq(req: {
  method?: string;
  raw?: { method?: string };
}): Record<string, unknown> {
  return { method: req.raw?.method ?? req.method };
}

/** The access line's response: its status only. */
export function safeRes(res: { statusCode?: number }): Record<string, unknown> {
  return { status: res.statusCode };
}
