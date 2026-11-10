import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { withFakeAi } from './fakes';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('request body limits', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let user: User;
  const oneMegabyte = 'a'.repeat(1024 * 1024);

  beforeAll(async () => {
    app = await createTestApp(withFakeAi);
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    user = await seedUser(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (url: string, body: object) =>
    request(app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .send(body);

  it('accepts a ~1 MB scan image on vision routes', async () => {
    const res = await post('/api/v1/vision/identify', {
      image_base64: oneMegabyte,
    });
    expect(res.status).not.toBe(413);
    expect(res.status).toBe(201);
  });

  it('keeps the small default limit everywhere else', async () => {
    const res = await post('/api/v1/ledger/plants', {
      name: 'x',
      species: oneMegabyte,
    });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
