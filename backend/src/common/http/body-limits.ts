import { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';
import { errorEnvelope } from '../filters/http-exception.filter';

/** Scan photos arrive as base64 JSON; everything else stays small. */
export const VISION_JSON_LIMIT = '8mb';
export const DEFAULT_JSON_LIMIT = '100kb';

type RawBodyRequest = Request & { rawBody?: Buffer };

const WEBHOOK_PATH = '/api/v1/subscription/webhook';

/**
 * Keeps the exact bytes for the Razorpay webhook (its signature is computed over
 * them). Only there: holding every body for the whole request doubles the memory
 * of each 8 MB scan photo.
 */
export const keepRawBody = (
  req: RawBodyRequest,
  _res: Response,
  buf: Buffer,
) => {
  // Express routes ignore case and a trailing slash; match the same way.
  const path = req.originalUrl.split('?')[0].replace(/\/+$/, '').toLowerCase();
  if (path === WEBHOOK_PATH) req.rawBody = buf;
};

/** Replaces Nest's default body parsers (create the app with bodyParser: false). */
export function applyBodyLimits(app: INestApplication): void {
  app.use('/api/v1/vision', json({ limit: VISION_JSON_LIMIT }));
  app.use(json({ limit: DEFAULT_JSON_LIMIT, verify: keepRawBody }));
  app.use(urlencoded({ extended: true, limit: DEFAULT_JSON_LIMIT }));
  // Parser errors happen before Nest's router, so map them to the envelope here.
  const logger = app.get(Logger);
  app.use(
    (
      err: { type?: string; status?: number },
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const refusal = parserRefusal(err);
      if (!refusal) return next(err);
      // These fail before routing and pino-http, so the error line is the request's line.
      logger.warn({
        reason: refusal.code,
        status: refusal.status,
        route: '(request body)',
        message: 'request failed',
      });
      res
        .status(refusal.status)
        .json(errorEnvelope(req, refusal.code, refusal.message));
    },
  );
}

/** A body the parser refused, as a client error (never a 500). */
export function parserRefusal(
  err: { type?: string; status?: number } | undefined,
): {
  status: number;
  code: string;
  message: string;
} | null {
  switch (err?.type) {
    case 'entity.too.large':
      return {
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body is too large',
      };
    case 'entity.parse.failed':
      return {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Request body is not valid JSON',
      };
    case 'encoding.unsupported':
    case 'charset.unsupported':
      return {
        status: 415,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Unsupported request encoding',
      };
    default:
      // Any other parser error with a 4xx status (aborted, bad length…) is the client's.
      return err?.status && err.status >= 400 && err.status < 500
        ? { status: err.status, code: 'BAD_REQUEST', message: 'Bad request' }
        : null;
  }
}
