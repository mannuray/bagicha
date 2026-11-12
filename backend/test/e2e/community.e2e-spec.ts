import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

const DAY = 864e5;

describe('community safety', () => {
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
    alice = await seedUser(prisma);
    bob = await seedUser(prisma);
  });
  afterAll(async () => {
    await app.close();
  });

  const as = (user: User) => {
    const auth = { Authorization: `Bearer ${tokenFor(app, user)}` };
    const server = app.getHttpServer();
    return {
      get: (url: string) => request(server).get(url).set(auth),
      post: (url: string, body: object = {}) =>
        request(server).post(url).set(auth).send(body),
    };
  };
  const postKey = (owner: string) => `posts/${owner}/${randomUUID()}.jpg`;

  it("refuses a post about someone else's plant", async () => {
    const plant = await seedPlant(prisma, alice.id);
    const res = await as(bob).post('/api/v1/community/posts', {
      content: 'Look at this tree',
      plant_id: plant.id,
    });
    expect(res.status).toBe(404);
  });

  it('accepts only your own post uploads, and builds their address itself', async () => {
    const key = postKey(alice.id);
    const res = await as(alice).post('/api/v1/community/posts', {
      content: 'New leaves',
      image_keys: [key],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.image_urls).toHaveLength(1);
    expect(res.body.data.image_urls[0]).toMatch(new RegExp(`/${key}$`));

    for (const bad of [
      postKey(bob.id),
      `avatars/${alice.id}/${randomUUID()}.jpg`,
      'https://evil.example/x.jpg',
    ]) {
      const refused = await as(alice).post('/api/v1/community/posts', {
        content: 'x',
        image_keys: [bad],
      });
      expect(refused.status).toBe(422);
    }
    const legacy = await as(alice).post('/api/v1/community/posts', {
      content: 'x',
      image_urls: ['https://evil.example/x.jpg'],
    });
    expect(legacy.status).toBe(422);
  });

  it('never shows an outside image address stored before this check', async () => {
    await prisma.post.create({
      data: {
        author_id: alice.id,
        content: 'old post',
        district: 'Patna',
        image_urls: ['https://evil.example/track.gif'],
      },
    });
    const feed = await as(bob).get('/api/v1/community/feed');
    expect(feed.body.data[0].image_urls).toEqual([]);
  });

  describe('hiding after reports', () => {
    const report = (user: User, postId: string) =>
      as(user).post(`/api/v1/community/posts/${postId}/report`, {
        reason: 'spam',
      });
    const established = () =>
      seedUser(prisma, { created_at: new Date(Date.now() - 30 * DAY) });
    const isHidden = async (id: string) =>
      (await prisma.post.findUniqueOrThrow({ where: { id } })).is_hidden;

    it('brand-new accounts cannot hide a post', async () => {
      const post = await prisma.post.create({
        data: { author_id: alice.id, content: 'my mango' },
      });
      await report(await seedUser(prisma), post.id);
      await report(await seedUser(prisma), post.id);
      await report(await established(), post.id);
      expect(await isHidden(post.id)).toBe(false);
    });

    it('three established accounts do', async () => {
      const post = await prisma.post.create({
        data: { author_id: alice.id, content: 'buy cheap seeds' },
      });
      for (let i = 0; i < 3; i += 1) await report(await established(), post.id);
      expect(await isHidden(post.id)).toBe(true);
    });
  });
});
