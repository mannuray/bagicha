import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WeatherAudienceRepository } from '../../src/modules/weather/weather-audience.repository';
import { createTestApp } from './app';
import {
  clearRateLimitKeys,
  resetDb,
  seedPlant,
  seedUser,
  tokenFor,
} from './fixtures';

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
      expect(kept.status).toBe(204);
      expect((await plants(token)).status).toBe(200);
    });
  });

  describe('others no longer see a pending account', () => {
    let bob: User;
    const as = (user: User) => ({
      get: (url: string) =>
        request(server())
          .get(url)
          .set('Authorization', `Bearer ${tokenFor(app, user)}`),
      post: (url: string, body: object) =>
        request(server())
          .post(url)
          .set('Authorization', `Bearer ${tokenFor(app, user)}`)
          .send(body),
    });
    beforeEach(async () => {
      bob = await seedUser(prisma);
    });

    it('their posts leave the feed and cannot be replied to', async () => {
      const post = await prisma.post.create({
        data: {
          author_id: alice.id,
          content: 'My lemon tree',
          district: 'Patna',
        },
      });
      await markPending(alice);
      const feed = await as(bob).get('/api/v1/community/feed');
      expect(feed.body.data.map((p: { id: string }) => p.id)).not.toContain(
        post.id,
      );
      const reply = await as(bob).post(
        `/api/v1/community/posts/${post.id}/comments`,
        { content: 'Nice' },
      );
      expect(reply.status).toBe(404);
    });

    it("the feed's reply counts leave out their replies, and their posts can't be reported", async () => {
      const bobPost = await prisma.post.create({
        data: {
          author_id: bob.id,
          content: 'mango question',
          district: 'Patna',
        },
      });
      await prisma.comment.create({
        data: { post_id: bobPost.id, author_id: alice.id, content: 'use neem' },
      });
      const alicePost = await prisma.post.create({
        data: { author_id: alice.id, content: 'my roof', district: 'Patna' },
      });
      await markPending(alice);
      const carol = await seedUser(prisma);
      const feed = await as(carol).get('/api/v1/community/feed');
      const row = feed.body.data.find(
        (p: { id: string }) => p.id === bobPost.id,
      );
      expect(row._count.comments).toBe(0);
      const report = await as(carol).post(
        `/api/v1/community/posts/${alicePost.id}/report`,
        { reason: 'spam' },
      );
      expect(report.status).toBe(404);
    });

    it('their conversations leave the inbox and they cannot be messaged', async () => {
      await as(alice).post('/api/v1/chat/messages', {
        receiver_id: bob.id,
        content: 'hello',
      });
      await markPending(alice);
      const inbox = await as(bob).get('/api/v1/chat/inbox');
      expect(inbox.body.data).toHaveLength(0);
      const thread = await as(bob).get(`/api/v1/chat/messages/${alice.id}`);
      expect(thread.body.data).toHaveLength(0);
      const sent = await as(bob).post('/api/v1/chat/messages', {
        receiver_id: alice.id,
        content: 'are you there?',
      });
      expect(sent.status).toBe(404);
    });

    it('the daily weather run skips them', async () => {
      await seedPlant(prisma, alice.id);
      await seedPlant(prisma, bob.id);
      await markPending(alice);
      const audience = await app.get(WeatherAudienceRepository).batch(null, 10);
      expect(audience.map((u) => u.id)).toEqual([bob.id]);
    });
  });

  it('once the 30 days are up, the account can no longer be kept', async () => {
    await prisma.user.update({
      where: { id: alice.id },
      data: {
        deletion_requested_at: new Date(Date.now() - 31 * 86_400_000),
        deletion_due_at: new Date(Date.now() - 86_400_000),
      },
    });
    const res = await request(server())
      .delete('/api/v1/user/deletion')
      .set('Authorization', `Bearer ${await freshToken(alice)}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_DELETION_DUE');
  });

  it('an account with nothing pending is unaffected', async () => {
    expect((await plants(tokenFor(app, alice))).status).toBe(200);
  });
});
