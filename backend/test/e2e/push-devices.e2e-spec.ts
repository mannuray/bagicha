import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { clearRateLimitKeys, resetDb, seedUser, tokenFor } from './fixtures';

describe('push devices', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  let bob: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    await clearRateLimitKeys();
    alice = await seedUser(prisma);
    bob = await seedUser(prisma, { phone_number: '+919999900002' });
  });
  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const register = (user: User, body: object) =>
    request(server())
      .put('/api/v1/user/devices')
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .send(body);
  const unregister = (user: User, token: string) =>
    request(server())
      .delete(`/api/v1/user/devices/${encodeURIComponent(token)}`)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`);
  const devices = () =>
    prisma.pushDevice.findMany({ orderBy: { created_at: 'asc' } });

  it('registers a phone', async () => {
    await register(alice, { token: 'tok-a', platform: 'ANDROID' }).expect(204);
    expect(await devices()).toMatchObject([
      { user_id: alice.id, token: 'tok-a', platform: 'ANDROID' },
    ]);
  });

  it('registering again refreshes the phone instead of adding one', async () => {
    await register(alice, { token: 'tok-a', platform: 'ANDROID' }).expect(204);
    const [first] = await devices();
    await new Promise((r) => setTimeout(r, 5));
    await register(alice, { token: 'tok-a', platform: 'ANDROID' }).expect(204);
    const rows = await devices();
    expect(rows).toHaveLength(1);
    expect(rows[0].last_seen_at.getTime()).toBeGreaterThan(
      first.last_seen_at.getTime(),
    );
  });

  it('moves a shared phone to whoever registered it last', async () => {
    await register(alice, { token: 'tok-shared', platform: 'ANDROID' });
    await register(bob, { token: 'tok-shared', platform: 'ANDROID' }).expect(
      204,
    );
    expect(await devices()).toMatchObject([
      { user_id: bob.id, token: 'tok-shared' },
    ]);
  });

  it('removes only your own phone', async () => {
    await register(alice, { token: 'tok-a', platform: 'ANDROID' });
    await unregister(bob, 'tok-a').expect(204);
    expect(await devices()).toHaveLength(1);
    await unregister(alice, 'tok-a').expect(204);
    expect(await devices()).toHaveLength(0);
  });

  it.each([
    ['an empty token', { token: '', platform: 'ANDROID' }],
    ['an unknown platform', { token: 'tok-a', platform: 'IOS' }],
    ['no token', { platform: 'ANDROID' }],
  ])('refuses %s', async (_label, body) => {
    await register(alice, body).expect(422);
  });

  it('needs a signed-in user', async () => {
    await request(server())
      .put('/api/v1/user/devices')
      .send({ token: 'tok-a', platform: 'ANDROID' })
      .expect(401);
  });

  it('signing out forgets every phone of the user', async () => {
    await register(alice, { token: 'tok-a1', platform: 'ANDROID' });
    await register(alice, { token: 'tok-a2', platform: 'ANDROID' });
    await register(bob, { token: 'tok-b', platform: 'ANDROID' });
    await request(server())
      .post('/api/v1/auth/sign-out')
      .set('Authorization', `Bearer ${tokenFor(app, alice)}`)
      .expect(204);
    expect(await devices()).toMatchObject([{ token: 'tok-b' }]);
  });

  it('asking to delete the account forgets its phones', async () => {
    await register(alice, { token: 'tok-a', platform: 'ANDROID' });
    await request(server())
      .post('/api/v1/user/deletion')
      .set('Authorization', `Bearer ${tokenFor(app, alice)}`)
      .expect(200);
    expect(await devices()).toHaveLength(0);
  });
});
