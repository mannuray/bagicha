import { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { json, urlencoded } from 'express';
import { errorEnvelope } from '../filters/http-exception.filter';

/** Scan photos arrive as base64 JSON; everything else stays small. */
export const VISION_JSON_LIMIT = '8mb';
export const DEFAULT_JSON_LIMIT = '100kb';

type RawBodyRequest = Request & { rawBody?: Buffer };

// Keep the exact bytes: the Razorpay webhook signature is computed over them.
const keepRawBody = (req: RawBodyRequest, _res: Response, buf: Buffer) => {
  req.rawBody = buf;
};

/** Replaces Nest's default body parsers (create the app with bodyParser: false). */
export function applyBodyLimits(app: INestApplication): void {
  app.use(
    '/api/v1/vision',
    json({ limit: VISION_JSON_LIMIT, verify: keepRawBody }),
  );
  app.use(json({ limit: DEFAULT_JSON_LIMIT, verify: keepRawBody }));
  app.use(
    urlencoded({
      extended: true,
      limit: DEFAULT_JSON_LIMIT,
      verify: keepRawBody,
    }),
  );
  // Parser errors happen before Nest's router, so map them to the envelope here.
  app.use(
    (
      err: { type?: string },
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      if (err?.type === 'entity.too.large') {
        res
          .status(413)
          .json(
            errorEnvelope(
              req,
              'PAYLOAD_TOO_LARGE',
              'Request body is too large',
            ),
          );
        return;
      }
      if (err?.type === 'entity.parse.failed') {
        res
          .status(400)
          .json(
            errorEnvelope(req, 'BAD_REQUEST', 'Request body is not valid JSON'),
          );
        return;
      }
      next(err);
    },
  );
}
