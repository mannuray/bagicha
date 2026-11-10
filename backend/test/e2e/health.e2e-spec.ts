import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RedisService } from '../../src/common/redis/redis.service';
import { createTestApp } from './app';

describe('health', () => {
  describe('all dependencies up', () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await createTestApp();
    });
    afterAll(async () => {
      await app.close();
    });

    it('reports ok with database and redis up', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.checks.database.status).toBe('up');
      expect(res.body.data.checks.redis.status).toBe('up');
    });

    it('answers liveness without touching dependencies', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health/live');
      expect(res.status).toBe(200);
    });
  });

  describe('redis down', () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await createTestApp((b) =>
        b.overrideProvider(RedisService).useValue({
          ping: () => Promise.reject(new Error('ECONNREFUSED')),
          get: () => Promise.reject(new Error('ECONNREFUSED')),
          set: () => Promise.reject(new Error('ECONNREFUSED')),
          del: () => Promise.reject(new Error('ECONNREFUSED')),
        }),
      );
    });
    afterAll(async () => {
      await app.close();
    });

    it('returns 503 and marks redis down', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('HEALTH_CHECK_FAILED');
      expect(res.body.error.details.checks.redis.status).toBe('down');
      expect(res.body.error.details.checks.database.status).toBe('up');
    });
  });
});
