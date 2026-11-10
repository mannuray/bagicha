import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

describe('plant ledger loop', () => {
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
      post: (url: string, body: object) =>
        request(server).post(url).set(auth).send(body),
      put: (url: string, body: object) =>
        request(server).put(url).set(auth).send(body),
    };
  };

  it('runs the whole loop for the owner with the existing response shapes', async () => {
    const a = as(alice);

    const created = await a.post('/api/v1/ledger/plants', {
      name: 'Aam',
      species: 'Mango',
      planting_date: '2018',
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name: 'Aam',
      species: 'Mango',
      user_id: alice.id,
      planting_date_precision: 'YEAR',
    });
    const plantId = created.body.data.id as string;

    const list = await a.get('/api/v1/ledger/plants');
    expect(list.status).toBe(200);
    expect(list.body.data.map((p: { id: string }) => p.id)).toEqual([plantId]);
    expect(list.body.pagination).toMatchObject({ page: 1, total_items: 1 });

    const detail = await a.get(`/api/v1/ledger/plants/${plantId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data._count).toEqual({ journal_entries: 0 });

    const entry = await a.post(`/api/v1/ledger/plants/${plantId}/journal`, {
      type: 'PEST_DIAGNOSIS',
      content: 'mealybugs on new flush',
    });
    expect(entry.status).toBe(201);
    expect(entry.body.data).toMatchObject({
      type: 'PEST_DIAGNOSIS',
      plant_id: plantId,
    });
    expect(entry.body.data.plant_cycle_id).toEqual(expect.any(String));

    const timeline = await a.get(`/api/v1/ledger/plants/${plantId}/timeline`);
    expect(timeline.body.data).toHaveLength(1);
    expect(timeline.body.pagination.total_items).toBe(1);

    const cycles = await a.get(`/api/v1/ledger/plants/${plantId}/cycles`);
    expect(cycles.status).toBe(200);
    expect(cycles.body.data[0]).toMatchObject({
      pest_pressure_score: 1,
      recent_events: [expect.objectContaining({ type: 'PEST_DIAGNOSIS' })],
    });
    expect(cycles.body.pagination.total_items).toBe(1);

    const tasks = await a.get(`/api/v1/ledger/plants/${plantId}/tasks`);
    const followUp = (tasks.body.data as Array<Record<string, unknown>>).find(
      (t) => t.type === 'TREAT',
    );
    expect(followUp).toMatchObject({
      title: 'Plan pest response for Aam',
      priority: 'HIGH',
      status: 'PENDING',
      source: 'MANUAL',
      source_summary: 'Created from pest diagnosis log: mealybugs on new flush',
    });

    const done = await a.put(
      `/api/v1/ledger/plants/${plantId}/tasks/${followUp!.id as string}`,
      { status: 'COMPLETED' },
    );
    expect(done.status).toBe(200);
    expect(done.body.data).toMatchObject({ status: 'COMPLETED' });
    expect(done.body.data.completed_at).toEqual(expect.any(String));

    const allTasks = await a.get('/api/v1/ledger/tasks');
    expect(allTasks.body.data[0]).toHaveProperty('tree_name', 'Aam');
    expect(allTasks.body.pagination).toBeDefined();

    const plan = await a.get(
      `/api/v1/ledger/plants/${plantId}/mitigation-plan`,
    );
    expect(plan.status).toBe(200);
    expect(plan.body.data).toMatchObject({
      likely_issues: expect.any(Array),
      completed_tasks: 1,
    });

    const state = await a.get(
      `/api/v1/ledger/plants/${plantId}/seasonal-state`,
    );
    expect(state.status).toBe(200);
    expect(state.body.data.species_family).toBe('mango');

    const updated = await a.put(`/api/v1/ledger/plants/${plantId}`, {
      name: 'Aam (old)',
    });
    expect(updated.body.data.name).toBe('Aam (old)');
  });

  it("returns 404 on every plant route for another user's plant", async () => {
    const plant = await seedPlant(prisma, alice.id);
    const task = await prisma.task.create({
      data: { plant_id: plant.id, type: 'WATER', due_date: new Date() },
    });
    const b = as(bob);
    const base = `/api/v1/ledger/plants/${plant.id}`;
    const responses = await Promise.all([
      b.get(base),
      b.get(`${base}/seasonal-state`),
      b.get(`${base}/timeline`),
      b.get(`${base}/cycles`),
      b.get(`${base}/tasks`),
      b.get(`${base}/mitigation-plan`),
      b.put(base, { name: 'stolen' }),
      b.post(`${base}/journal`, { type: 'NOTE' }),
      b.put(`${base}/tasks/${task.id}`, { status: 'COMPLETED' }),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PLANT_NOT_FOUND');
    }
    expect(await prisma.journalEntry.count()).toBe(0);
    const stored = await prisma.task.findUniqueOrThrow({
      where: { id: task.id },
    });
    expect(stored.status).toBe('PENDING');
  });

  it("doesn't list another user's plants or tasks", async () => {
    await seedPlant(prisma, alice.id);
    const b = as(bob);
    expect((await b.get('/api/v1/ledger/plants')).body.data).toEqual([]);
    expect((await b.get('/api/v1/ledger/tasks')).body.data).toEqual([]);
  });
  describe('timeline type filter', () => {
    const setup = async () => {
      const a = as(alice);
      const plant = await a.post('/api/v1/ledger/plants', {
        name: 'Aam',
        species: 'Mango',
      });
      const plantId = plant.body.data.id as string;
      await a.post(`/api/v1/ledger/plants/${plantId}/journal`, {
        type: 'NOTE',
        content: 'hello',
      });
      await a.post(`/api/v1/ledger/plants/${plantId}/journal`, {
        type: 'HARVEST',
        metadata: { quantity_value: 10, quantity_unit: 'kg' },
      });
      return { a, url: `/api/v1/ledger/plants/${plantId}/timeline` };
    };

    it('filters the timeline by types', async () => {
      const { a, url } = await setup();
      const res = await a.get(`${url}?types=HARVEST`);
      expect(res.status).toBe(200);
      expect(res.body.data.map((i: { type: string }) => i.type)).toEqual([
        'HARVEST',
      ]);
      expect(res.body.pagination.total_items).toBe(1);
    });

    it('accepts several comma-separated types', async () => {
      const { a, url } = await setup();
      const res = await a.get(`${url}?types=HARVEST,NOTE`);
      expect(res.body.pagination.total_items).toBe(2);
    });

    it('rejects an unknown timeline type', async () => {
      const { a, url } = await setup();
      const res = await a.get(`${url}?types=BANANA`);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('keeps the unfiltered timeline unchanged', async () => {
      const { a, url } = await setup();
      const res = await a.get(url);
      expect(res.body.pagination.total_items).toBe(2);
    });
  });
  it('returns the species life profile on plant detail', async () => {
    const a = as(alice);
    const papaya = await a.post('/api/v1/ledger/plants', {
      name: 'Papita',
      species: 'Papaya',
    });
    const detail = await a.get(`/api/v1/ledger/plants/${papaya.body.data.id}`);
    expect(detail.body.data.life_profile).toMatchObject({
      first_fruit_months: [8, 12],
      note_key: 'papaya',
    });
    const rose = await a.post('/api/v1/ledger/plants', {
      name: 'Gulab',
      species: 'Rose',
    });
    const roseDetail = await a.get(
      `/api/v1/ledger/plants/${rose.body.data.id}`,
    );
    expect(roseDetail.body.data.life_profile).toBeNull();
  });
});
