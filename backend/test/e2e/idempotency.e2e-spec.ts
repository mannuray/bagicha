import { INestApplication } from '@nestjs/common';
import { Plant, PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

describe('Idempotency-Key on creates', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  let bob: User;
  let plant: Plant;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
    bob = await seedUser(prisma);
    plant = await seedPlant(prisma, alice.id);
  });

  afterAll(async () => {
    await app.close();
  });

  const journal = (user: User, plantId: string, key?: string) => {
    const r = request(app.getHttpServer())
      .post(`/api/v1/ledger/plants/${plantId}/journal`)
      .set('Authorization', `Bearer ${tokenFor(app, user)}`);
    if (key) void r.set('Idempotency-Key', key);
    return r.send({ type: 'NOTE', content: 'watered the roots' });
  };
  const entries = (plantId: string) =>
    prisma.journalEntry.count({ where: { plant_id: plantId } });

  it('a retried create with the same key makes one entry and replays the answer', async () => {
    const key = `k-${Date.now()}-a`;
    const first = await journal(alice, plant.id, key);
    const retry = await journal(alice, plant.id, key);
    expect(first.status).toBe(201);
    expect(retry.status).toBe(201);
    expect(retry.body.data).toEqual(first.body.data);
    expect(await entries(plant.id)).toBe(1);
  });

  it('two copies at once make one entry; the other waits its turn or replays', async () => {
    const key = `k-${Date.now()}-b`;
    const [a, b] = await Promise.all([
      journal(alice, plant.id, key),
      journal(alice, plant.id, key),
    ]);
    expect([a.status, b.status]).toContain(201);
    for (const res of [a, b])
      if (res.status !== 201) {
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('IDEMPOTENCY_IN_PROGRESS');
      }
    expect(await entries(plant.id)).toBe(1);
  });

  it('keys belong to one user', async () => {
    const bobPlant = await seedPlant(prisma, bob.id);
    const key = `k-${Date.now()}-c`;
    expect((await journal(alice, plant.id, key)).status).toBe(201);
    expect((await journal(bob, bobPlant.id, key)).status).toBe(201);
    expect(await entries(bobPlant.id)).toBe(1);
  });

  it('a failed create does not keep the key: the fixed retry goes through', async () => {
    const key = `k-${Date.now()}-d`;
    expect((await journal(alice, 'no-such-plant', key)).status).toBe(404);
    expect((await journal(alice, plant.id, key)).status).toBe(201);
  });

  it('refuses a malformed key', async () => {
    const res = await journal(alice, plant.id, 'bad key!');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_INVALID');
    expect(await entries(plant.id)).toBe(0);
  });

  it('without a key, every request creates (unchanged)', async () => {
    await journal(alice, plant.id);
    await journal(alice, plant.id);
    expect(await entries(plant.id)).toBe(2);
  });
});
