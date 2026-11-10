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
});
