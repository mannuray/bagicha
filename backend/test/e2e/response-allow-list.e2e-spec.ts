import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { clearRateLimitKeys, resetDb, seedUser, tokenFor } from './fixtures';

/** Responses are built field by field: no database row reaches a client. */
const USER_FIELDS = [
  'avatar_key',
  'badge_level',
  'district',
  'garden_types',
  'id',
  'language_pref',
  'name',
  'phone_number',
  'premium_expires_at',
  'region_cluster',
  'subscription_tier',
].sort();

describe('response allow-lists', () => {
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
    await prisma.user.update({
      where: { id: user.id },
      data: { latitude: 25.6, longitude: 85.1 },
    });
  });
  afterAll(async () => {
    await app.close();
  });

  it('the profile update returns only the user fields the app shows (no coordinates, no internals)', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/v1/user/profile/update')
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .send({ name: 'Asha' });
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(USER_FIELDS);
  });

  it('sign-in returns the same user view', async () => {
    await clearRateLimitKeys();
    const server = app.getHttpServer();
    const otp = await request(server)
      .post('/api/v1/auth/request-otp')
      .send({ phone_number: user.phone_number });
    const res = await request(server)
      .post('/api/v1/auth/verify-otp')
      .send({ phone_number: user.phone_number, otp: otp.body.data.dev_otp });
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data.user).sort()).toEqual(USER_FIELDS);
  });

  /** Internal columns that must never reach a client, at any depth. */
  const INTERNAL = [
    'user_id',
    'updated_at',
    'is_hidden',
    'latitude',
    'longitude',
    'source_key',
  ];
  function internalKeys(value: unknown, path = ''): string[] {
    if (Array.isArray(value))
      return value.flatMap((v, i) => internalKeys(v, `${path}[${i}]`));
    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).flatMap(
        ([k, v]) => [
          ...(INTERNAL.includes(k) ? [`${path}.${k}`] : []),
          ...internalKeys(v, `${path}.${k}`),
        ],
      );
    }
    return [];
  }

  it('no endpoint returns an internal column', async () => {
    const server = app.getHttpServer();
    const auth = { Authorization: `Bearer ${tokenFor(app, user)}` };
    const other = await seedUser(prisma);
    const call = (
      method: 'get' | 'post' | 'put',
      url: string,
      body?: object,
    ) => {
      const r = request(server)[method](`/api/v1${url}`).set(auth);
      return body ? r.send(body) : r;
    };
    const plant = (
      await call('post', '/ledger/plants', {
        name: 'Aam',
        species: 'Mango',
        planting_date: '2017',
      })
    ).body.data;
    const place = (
      await call('post', '/garden/places', { name: 'Bed 1', kind: 'BED' })
    ).body.data;
    const post = (
      await call('post', '/community/posts', {
        content: 'Mango flowers early this year',
      })
    ).body.data;
    const responses = {
      createPlant: plant,
      plantList: (await call('get', '/ledger/plants')).body.data,
      plantDetail: (await call('get', `/ledger/plants/${plant.id}`)).body.data,
      updatePlant: (
        await call('put', `/ledger/plants/${plant.id}`, { name: 'Old Aam' })
      ).body.data,
      journal: (
        await call('post', `/ledger/plants/${plant.id}/journal`, {
          type: 'NOTE',
          content: 'hi',
        })
      ).body.data,
      timeline: (await call('get', `/ledger/plants/${plant.id}/timeline`)).body
        .data,
      cycles: (await call('get', `/ledger/plants/${plant.id}/cycles`)).body
        .data,
      tasks: (await call('get', '/ledger/tasks')).body.data,
      place,
      places: (await call('get', '/garden/places')).body.data,
      plan: (await call('post', '/crops/plan', { crop_id: 'tomato' })).body
        .data,
      post,
      feed: (await call('get', '/community/feed')).body.data,
      comment: (
        await call('post', `/community/posts/${post.id}/comments`, {
          content: 'Same here',
        })
      ).body.data,
      message: (
        await call('post', '/chat/messages', {
          receiver_id: other.id,
          content: 'Hello',
        })
      ).body.data,
      inbox: (await call('get', '/chat/inbox')).body.data,
      thread: (await call('get', `/chat/messages/${other.id}`)).body.data,
      ended: (
        await call('post', `/ledger/plants/${plant.id}/end`, {
          reason: 'WEATHER',
        })
      ).body.data,
      restored: (await call('post', `/ledger/plants/${plant.id}/restore`)).body
        .data,
    };
    for (const [name, body] of Object.entries(responses)) {
      expect(body).toBeDefined();
      expect([name, internalKeys(body)]).toEqual([name, []]);
    }
  });
});
