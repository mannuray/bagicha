import type { Request, Response } from 'express';
import { keepRawBody } from './body-limits';

type Req = Request & { rawBody?: Buffer };
const req = (originalUrl: string) => ({ originalUrl }) as Req;
const buf = Buffer.from('{"a":1}');

describe('keepRawBody', () => {
  it('keeps the exact bytes for the payment webhook (its signature covers them)', () => {
    const r = req('/api/v1/subscription/webhook');
    keepRawBody(r, {} as Response, buf);
    expect(r.rawBody).toBe(buf);
  });

  it('does not hold a second copy of every other body (8 MB scan photos)', () => {
    for (const url of ['/api/v1/vision/diagnose', '/api/v1/ledger/plants']) {
      const r = req(url);
      keepRawBody(r, {} as Response, buf);
      expect(r.rawBody).toBeUndefined();
    }
  });
});
