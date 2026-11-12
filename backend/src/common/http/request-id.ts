import { isSpanContextValid, trace } from '@opentelemetry/api';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/** A client id we accept as is: short, plain characters (never markup or log noise). */
const WELL_FORMED = /^[A-Za-z0-9-]{8,64}$/;

/** The request's id: the trace id when tracing, else a well-formed client id, else a new UUID. */
export function resolveRequestId(clientId: string | undefined): string {
  const span = trace.getActiveSpan()?.spanContext();
  if (span && isSpanContextValid(span)) return span.traceId;
  if (clientId && WELL_FORMED.test(clientId)) return clientId;
  return randomUUID();
}

/**
 * Runs first on every request: settles one request id, writes it back onto the
 * request (so the logger, context, monitor, envelope and error filter all read the
 * same value) and returns it in the X-Request-ID header, success or error.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers['x-request-id'];
  const id = resolveRequestId(Array.isArray(header) ? header[0] : header);
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
}
