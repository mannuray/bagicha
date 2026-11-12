import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RATE_LIMIT_BACKEND } from '../../src/common/rate-limit/fail-open.storage';
import { createTestApp } from './app';
import { clearRateLimitKeys } from './fixtures';

// A fresh phone per request: one phone also has its own one-a-minute cooldown.
let seq = 0;

describe('rate limiting', () => {
  describe('with Redis available', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp();
    });
    beforeEach(clearRateLimitKeys);
    afterAll(async () => {
      await clearRateLimitKeys();
      await app.close();
    });

    it('counts each visitor separately behind the proxy (trust proxy), not all as one', async () => {
      await clearRateLimitKeys();
      const ask = (ip: string) =>
        request(app.getHttpServer())
          .post('/api/v1/auth/request-otp')
          .set('X-Forwarded-For', ip)
          .send({ phone_number: `+9190000${String(++seq).padStart(5, '0')}` });
      for (let i = 0; i < 5; i += 1) await ask('203.0.113.1');
      expect((await ask('203.0.113.1')).status).toBe(429);
      expect((await ask('203.0.113.2')).status).not.toBe(429);
    });

    it('rejects the 6th OTP request in a minute with RATE_LIMITED', async () => {
      const send = () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/request-otp')
          .send({ phone_number: `+9199999${String(++seq).padStart(5, '0')}` });
      for (let i = 0; i < 5; i++) {
        expect((await send()).status).toBe(200);
      }
      const blocked = await send();
      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMITED');
      expect(blocked.body.error.details).toEqual({ bucket: 'auth' });
    });
  });

  describe('when the rate-limit store is down', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp((b) =>
        b.overrideProvider(RATE_LIMIT_BACKEND).useValue({
          increment: () => Promise.reject(new Error('ECONNREFUSED')),
        }),
      );
    });
    afterAll(async () => {
      await app.close();
    });

    it('fails open: requests still go through', async () => {
      for (let i = 0; i < 7; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/request-otp')
          .send({ phone_number: `+9198888${String(++seq).padStart(5, '0')}` });
        expect(res.status).toBe(200);
      }
    });

    it('still fails closed on OTP verification without a stored code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phone_number: '+919999900003', otp: '000000' });
      expect(res.status).toBe(401);
    });
  });
});
