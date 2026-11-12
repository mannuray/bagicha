import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

describe('data integrity', () => {
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

  it('the audit log is append-only: the database refuses to change or delete a row', async () => {
    const row = await prisma.auditEvent.create({
      data: { action: 'TEST', target_type: 'x', target_id: 'y', snapshot: {} },
    });
    await expect(
      prisma.auditEvent.update({
        where: { id: row.id },
        data: { action: 'EDITED' },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.auditEvent.delete({ where: { id: row.id } }),
    ).rejects.toThrow();
    expect(await prisma.auditEvent.count()).toBe(1);
  });

  it('reporting a post twice at once files one report, and both calls succeed', async () => {
    const auth = { Authorization: `Bearer ${tokenFor(app, alice)}` };
    const other = await seedUser(prisma);
    const post = await prisma.post.create({
      data: { author_id: other.id, content: 'Buy cheap seeds here' },
    });
    const report = () =>
      request(app.getHttpServer())
        .post(`/api/v1/community/posts/${post.id}/report`)
        .set(auth)
        .send({ reason: 'spam' });
    const [a, b] = await Promise.all([report(), report()]);
    expect([a.status, b.status]).toEqual([201, 201]);
    expect(await prisma.report.count({ where: { target_id: post.id } })).toBe(
      1,
    );
  });
});
