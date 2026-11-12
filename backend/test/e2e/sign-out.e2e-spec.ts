import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('sign out', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
  });
  afterAll(async () => {
    await app.close();
  });

  const profile = (token: string) =>
    request(app.getHttpServer())
      .get('/api/v1/ledger/plants')
      .set('Authorization', `Bearer ${token}`);

  it('a token issued before this change (no version) still works', async () => {
    expect((await profile(tokenFor(app, alice))).status).toBe(200);
  });

  it('signing out ends that token and every other device too', async () => {
    const phone = tokenFor(app, alice);
    const laptop = app.get(JwtService).sign({ sub: alice.id, tv: 0 });
    const out = await request(app.getHttpServer())
      .post('/api/v1/auth/sign-out')
      .set('Authorization', `Bearer ${phone}`);
    expect(out.status).toBe(204);
    for (const token of [phone, laptop]) {
      const res = await profile(token);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_TOKEN_REVOKED');
    }
  });

  it('signing in again gives a working token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-out')
      .set('Authorization', `Bearer ${tokenFor(app, alice)}`);
    const fresh = await prisma.user.findUniqueOrThrow({
      where: { id: alice.id },
    });
    const token = app.get(JwtService).sign({
      sub: alice.id,
      tv: (fresh as { token_version?: number }).token_version,
    });
    expect((await profile(token)).status).toBe(200);
  });

  it('needs a signed-in user', async () => {
    expect(
      (await request(app.getHttpServer()).post('/api/v1/auth/sign-out')).status,
    ).toBe(401);
  });
});
