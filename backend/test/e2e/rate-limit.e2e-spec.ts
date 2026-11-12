import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RATE_LIMIT_BACKEND } from '../../src/common/rate-limit/fail-open.storage';
import { createTestApp } from './app';
import { clearRateLimitKeys } from './fixtures';

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

    it('rejects the 6th OTP request in a minute with RATE_LIMITED', async () => {
      const send = () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/request-otp')
          .send({ phone_number: '+919999900001' });
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
          .send({ phone_number: '+919999900002' });
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
