import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('chat pagination', () => {
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
    for (let i = 0; i < 5; i++) {
      await prisma.message.create({
        data: {
          sender_id: i % 2 ? bob.id : alice.id,
          receiver_id: i % 2 ? alice.id : bob.id,
          content: `m${i}`,
          created_at: new Date(Date.UTC(2026, 0, 1, 0, i)),
        },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const get = (url: string) =>
    request(app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${tokenFor(app, alice)}`);

  it('pages a conversation oldest first', async () => {
    const first = await get(
      `/api/v1/chat/messages/${bob.id}?page=1&page_size=2`,
    );
    expect(first.status).toBe(200);
    expect(first.body.data.map((m: { content: string }) => m.content)).toEqual([
      'm0',
      'm1',
    ]);
    expect(first.body.pagination).toMatchObject({
      total_items: 5,
      has_next: true,
    });

    const second = await get(
      `/api/v1/chat/messages/${bob.id}?page=2&page_size=2`,
    );
    expect(second.body.data.map((m: { content: string }) => m.content)).toEqual(
      ['m2', 'm3'],
    );
  });

  it('pages the inbox', async () => {
    const res = await get('/api/v1/chat/inbox?page_size=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('rejects an oversized page', async () => {
    expect((await get('/api/v1/chat/inbox?page_size=10000')).status).toBe(422);
  });

  describe('blocking', () => {
    const as = (user: User) => {
      const auth = { Authorization: `Bearer ${tokenFor(app, user)}` };
      const server = app.getHttpServer();
      return {
        get: (url: string) => request(server).get(url).set(auth),
        post: (url: string, body: object = {}) =>
          request(server).post(url).set(auth).send(body),
        del: (url: string) => request(server).delete(url).set(auth),
      };
    };

    it('someone you blocked cannot message you, and their messages leave your inbox', async () => {
      expect(
        (await as(alice).post(`/api/v1/chat/blocks/${bob.id}`)).status,
      ).toBe(204);
      const sent = await as(bob).post('/api/v1/chat/messages', {
        receiver_id: alice.id,
        content: 'hello?',
      });
      expect(sent.status).toBe(403);
      expect(sent.body.error.code).toBe('CHAT_BLOCKED');
      const inbox = await as(alice).get('/api/v1/chat/inbox');
      expect(
        (inbox.body.data as Array<{ sender_id: string }>).filter(
          (m) => m.sender_id === bob.id,
        ),
      ).toEqual([]);
      const convo = await as(alice).get(`/api/v1/chat/messages/${bob.id}`);
      expect(
        (convo.body.data as Array<{ sender_id: string }>).filter(
          (m) => m.sender_id === bob.id,
        ),
      ).toEqual([]);
    });

    it('unblocking lets them write again; blocking twice is fine', async () => {
      await as(alice).post(`/api/v1/chat/blocks/${bob.id}`);
      expect(
        (await as(alice).post(`/api/v1/chat/blocks/${bob.id}`)).status,
      ).toBe(204);
      expect(
        (await as(alice).del(`/api/v1/chat/blocks/${bob.id}`)).status,
      ).toBe(204);
      const sent = await as(bob).post('/api/v1/chat/messages', {
        receiver_id: alice.id,
        content: 'hi again',
      });
      expect(sent.status).toBe(201);
    });

    it('refuses blocking yourself or an unknown user', async () => {
      expect(
        (await as(alice).post(`/api/v1/chat/blocks/${alice.id}`)).status,
      ).toBe(422);
      expect(
        (
          await as(alice).post(
            '/api/v1/chat/blocks/0f8fad5b-d9cb-469f-a165-70867728950e',
          )
        ).status,
      ).toBe(404);
      expect((await as(alice).post('/api/v1/chat/blocks/abc')).status).toBe(
        404,
      );
    });
  });
});
