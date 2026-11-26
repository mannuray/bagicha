import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { fakeGoogleToken } from './fake-google';
import { clearRateLimitKeys, resetDb, seedUser } from './fixtures';

describe('sign in with Google', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const signIn = (idToken: string) =>
    request(app.getHttpServer())
      .post('/api/v1/auth/google')
      .send({ id_token: idToken });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    await clearRateLimitKeys();
  });
  afterAll(async () => {
    await clearRateLimitKeys();
    await app.close();
  });

  it('a new Google account gets a session and lands in onboarding', async () => {
    const res = await signIn(fakeGoogleToken('new-sub', 'new@example.test'));
    expect(res.status).toBe(200);
    expect(typeof res.body.data.access_token).toBe('string');
    expect(res.body.data.user).toMatchObject({
      email: 'new@example.test',
      name: 'Fake Gardener',
      district: null,
    });
    const me = await request(app.getHttpServer())
      .patch('/api/v1/user/profile')
      .set('Authorization', `Bearer ${res.body.data.access_token}`)
      .send({ language_pref: 'en' });
    expect(me.status).toBe(200);
  });

  it('two simultaneous first sign-ins create one account', async () => {
    const token = fakeGoogleToken('twin-sub', 'twin@example.test');
    const [a, b] = await Promise.all([signIn(token), signIn(token)]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(a.body.data.user.id).toBe(b.body.data.user.id);
    expect(await prisma.user.count({ where: { google_sub: 'twin-sub' } })).toBe(
      1,
    );
  });

  it('claims the one unclaimed account with that email, in any letter case, keeping its data', async () => {
    const old = await seedUser(prisma, {
      google_sub: null,
      email: 'owner@example.test',
      name: 'Owner',
    });
    const res = await signIn(
      fakeGoogleToken('owner-sub', 'Owner@Example.test'),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: old.id, name: 'Owner' });
    const row = await prisma.user.findUniqueOrThrow({ where: { id: old.id } });
    expect(row.google_sub).toBe('owner-sub');
  });

  it('never claims an account already tied to another Google account', async () => {
    const taken = await seedUser(prisma, { email: 'shared@example.test' });
    const res = await signIn(
      fakeGoogleToken('other-sub', 'shared@example.test'),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).not.toBe(taken.id);
  });

  it('claims nothing when two unclaimed accounts share the email', async () => {
    const a = await seedUser(prisma, {
      google_sub: null,
      email: 'dup@example.test',
    });
    const b = await seedUser(prisma, {
      google_sub: null,
      email: 'dup@example.test',
    });
    const res = await signIn(fakeGoogleToken('dup-sub', 'dup@example.test'));
    expect(res.status).toBe(200);
    expect([a.id, b.id]).not.toContain(res.body.data.user.id);
  });

  it('an account waiting to be deleted signs in to itself', async () => {
    const leaving = await seedUser(prisma, {
      deletion_requested_at: new Date(),
      deletion_due_at: new Date(Date.now() + 86_400_000),
    });
    const res = await signIn(
      fakeGoogleToken(leaving.google_sub!, leaving.email!),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(leaving.id);
    expect(res.body.data.user.deletion_due_at).not.toBeNull();
  });

  it('a rejected token is refused with AUTH_GOOGLE_INVALID', async () => {
    const res = await signIn('not-a-google-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_GOOGLE_INVALID');
  });

  it('the old phone sign-in routes are gone', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phone_number: '+919999999999' });
    expect(res.status).toBe(404);
  });
});
