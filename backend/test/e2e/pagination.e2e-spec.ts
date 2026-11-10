import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

/** Review Focus #4: garbage paging params must be a 422, never a 500 or an unbounded query. */
describe('pagination parameters', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let user: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    user = await seedUser(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (url: string) =>
    request(app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`);

  const BAD = ['page=0', 'page=-3', 'page=abc', 'page_size=10000'];

  describe.each([['/api/v1/ledger/plants'], ['/api/v1/ledger/tasks']])(
    '%s',
    (url) => {
      it.each(BAD)('rejects ?%s with 422', async (query) => {
        const res = await get(`${url}?${query}`);
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('accepts the maximum page size', async () => {
        expect((await get(`${url}?page_size=100`)).status).toBe(200);
      });
    },
  );

  describe('/api/v1/community/feed', () => {
    it.todo(`rejects ${BAD.join(', ')} with 422 (Task 21)`);
  });

  it('keeps the harness wired', async () => {
    expect((await get('/api/v1/health/live')).status).toBe(200);
  });
});
