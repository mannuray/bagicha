import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

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
    await expect(
      prisma.$executeRawUnsafe('TRUNCATE TABLE "audit_events"'),
    ).rejects.toThrow();
    expect(await prisma.auditEvent.count()).toBe(1);
  });

  it('materializing twice at once makes one copy of each seasonal task', async () => {
    // Guava is still on season packs (mango now has dated care).
    const plant = await seedPlant(prisma, alice.id, {
      planting_date: new Date('2018-01-01'),
      species: 'Guava',
      species_family: 'guava',
    });
    const materialize = () =>
      request(app.getHttpServer())
        .post(`/api/v1/seasonal/plant/${plant.id}/materialize-tasks`)
        .set({ Authorization: `Bearer ${tokenFor(app, alice)}` });
    const [a, b] = await Promise.all([materialize(), materialize()]);
    expect([a.status, b.status]).toEqual([201, 201]);
    const tasks = await prisma.task.findMany({
      where: { plant_id: plant.id, source: 'SEASONAL_PACK', status: 'PENDING' },
    });
    const keys = tasks.map((t) => t.source_key);
    expect(tasks.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('the database allows only one pending task per source key', async () => {
    const plant = await seedPlant(prisma, alice.id);
    const task = {
      plant_id: plant.id,
      type: 'WATER' as const,
      priority: 'MEDIUM' as const,
      source: 'SYSTEM' as const,
      source_key: 'k1',
      due_date: new Date(),
    };
    await prisma.task.create({ data: task });
    await expect(prisma.task.create({ data: task })).rejects.toThrow();
    // Closed copies don't count.
    await prisma.task.updateMany({
      where: { plant_id: plant.id },
      data: { status: 'COMPLETED' },
    });
    await expect(prisma.task.create({ data: task })).resolves.toBeDefined();
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
