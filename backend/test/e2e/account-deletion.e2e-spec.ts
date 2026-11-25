import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { clearRateLimitKeys, resetDb, seedUser, tokenFor } from './fixtures';

describe('account deletion', () => {
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

  const server = () => app.getHttpServer();
  const plants = (token: string) =>
    request(server())
      .get('/api/v1/ledger/plants')
      .set('Authorization', `Bearer ${token}`);
  /** A token for the user's current sign-in version (what a fresh sign-in issues). */
  async function freshToken(user: User): Promise<string> {
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return app.get(JwtService).sign({ sub: row.id, tv: row.token_version });
  }
  async function markPending(user: User) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletion_requested_at: new Date(),
        deletion_due_at: new Date(Date.now() + 30 * 86_400_000),
      },
    });
  }

  describe('while deletion is pending', () => {
    it('refuses ordinary routes with ACCOUNT_DELETION_PENDING', async () => {
      await markPending(alice);
      const res = await plants(await freshToken(alice));
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_DELETION_PENDING');
    });

    it('still allows signing out', async () => {
      await markPending(alice);
      const res = await request(server())
        .post('/api/v1/auth/sign-out')
        .set('Authorization', `Bearer ${await freshToken(alice)}`);
      expect(res.status).toBe(204);
    });

    it('sign-in succeeds and tells the app the deletion date', async () => {
      await markPending(alice);
      await clearRateLimitKeys();
      const otp = await request(server())
        .post('/api/v1/auth/request-otp')
        .send({ phone_number: alice.phone_number });
      const res = await request(server())
        .post('/api/v1/auth/verify-otp')
        .send({ phone_number: alice.phone_number, otp: otp.body.data.dev_otp });
      expect(res.status).toBe(200);
      expect(res.body.data.user.deletion_due_at).not.toBeNull();
    });
  });

  describe('asking and keeping', () => {
    const ask = (token: string) =>
      request(server())
        .post('/api/v1/user/deletion')
        .set('Authorization', `Bearer ${token}`);
    const keep = (token: string) =>
      request(server())
        .delete('/api/v1/user/deletion')
        .set('Authorization', `Bearer ${token}`);

    it('asking schedules deletion 30 days out and signs out every device', async () => {
      const before = Date.now();
      const old = tokenFor(app, alice);
      const res = await ask(old);
      expect(res.status).toBe(200);
      const due = new Date(res.body.data.deletion_due_at).getTime();
      expect(due - before).toBeGreaterThanOrEqual(30 * 86_400_000 - 5_000);
      expect(due - before).toBeLessThanOrEqual(30 * 86_400_000 + 5_000);
      const stale = await plants(old);
      expect(stale.status).toBe(401);
      expect(stale.body.error.code).toBe('AUTH_TOKEN_REVOKED');
    });

    it('signing back in, keeping the account restores everything', async () => {
      await ask(tokenFor(app, alice));
      const token = await freshToken(alice);
      expect((await plants(token)).status).toBe(403);
      const kept = await keep(token);
      expect(kept.status).toBe(200);
      expect(kept.body.data.deletion_due_at).toBeNull();
      expect((await plants(token)).status).toBe(200);
    });
  });

  it('an account with nothing pending is unaffected', async () => {
    expect((await plants(tokenFor(app, alice))).status).toBe(200);
  });
});
