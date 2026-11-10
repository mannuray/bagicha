import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './app';

const preflight = (app: INestApplication, origin: string) =>
  request(app.getHttpServer())
    .options('/api/v1/ledger/plants')
    .set('Origin', origin)
    .set('Access-Control-Request-Method', 'GET')
    .set('Access-Control-Request-Headers', 'authorization');

describe('CORS', () => {
  describe('with WEB_ORIGINS set', () => {
    let app: INestApplication;
    beforeAll(async () => {
      process.env.WEB_ORIGINS = 'http://localhost:5173';
      app = await createTestApp();
    });
    afterAll(async () => {
      delete process.env.WEB_ORIGINS;
      await app.close();
    });

    it('allows the configured origin', async () => {
      const res = await preflight(app, 'http://localhost:5173');
      expect(res.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173',
      );
      expect(String(res.headers['access-control-allow-headers'])).toMatch(
        /authorization/i,
      );
    });

    it('does not allow other origins', async () => {
      const res = await preflight(app, 'http://evil.test');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
