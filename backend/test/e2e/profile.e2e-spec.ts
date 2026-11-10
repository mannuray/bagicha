import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('profile region', () => {
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

  const update = (body: object) =>
    request(app.getHttpServer())
      .put('/api/v1/user/profile/update')
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .send(body);

  it('stores the chosen region and district', async () => {
    const res = await update({
      region_cluster: 'SOUTH_DECCAN',
      district: 'Mysuru',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      region_cluster: 'SOUTH_DECCAN',
      district: 'Mysuru',
    });
  });

  it('rejects an unknown region', async () => {
    expect((await update({ region_cluster: 'MARS' })).status).toBe(422);
  });
});
