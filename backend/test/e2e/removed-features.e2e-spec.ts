import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

/** Features taken out before launch: a signed-in caller gets 404, not fake data. */
describe('removed features', () => {
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

  it.each([
    ['get', 'marketplace/items'],
    ['post', 'marketplace/buy'],
  ] as const)(
    '%s %s is gone (it only ever returned made-up items)',
    async (method, path) => {
      const res = await request(app.getHttpServer())
        [method](`/api/v1/${path}`)
        .set('Authorization', `Bearer ${tokenFor(app, user)}`)
        .send({ item_id: 'item_1' });
      expect(res.status).toBe(404);
    },
  );
});
