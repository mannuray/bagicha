import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { TaskRepository } from '../../src/modules/plant-ledger/repositories/task.repository';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { withFakeAi } from './fakes';
import { resetDb, seedUser, tokenFor } from './fixtures';

const TINY_JPEG_B64 = Buffer.from('fake-image').toString('base64');

describe('when a tree ends', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  let bob: User;

  beforeAll(async () => {
    app = await createTestApp(withFakeAi);
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
      put: (url: string, body: object) =>
        request(server).put(url).set(auth).send(body),
    };
  };

  /** A plant with one pending task and one pest diagnosis entry. */
  async function plantWithTask(user = alice) {
    const a = as(user);
    const plant = await a.post('/api/v1/ledger/plants', {
      name: 'Nimbu',
      species: 'Lemon',
      planting_date: '2020',
    });
    const id = plant.body.data.id as string;
    const pest = await a.post(`/api/v1/ledger/plants/${id}/journal`, {
      type: 'PEST_DIAGNOSIS',
      content: 'Canker spots',
    });
    const tasks = await a.get(`/api/v1/ledger/plants/${id}/tasks`);
    const pending = (
      tasks.body.data as Array<{ id: string; status: string }>
    ).filter((t) => t.status === 'PENDING');
    expect(pending.length).toBeGreaterThan(0);
    return {
      a,
      id,
      entryId: pest.body.data.id as string,
      base: `/api/v1/ledger/plants/${id}`,
    };
  }

  it('ends a plant: fields set, a PLANT_ENDED entry, pending tasks cancelled', async () => {
    const { a, id, entryId, base } = await plantWithTask();
    const res = await a.post(`${base}/end`, {
      reason: 'DISEASE_OR_PEST',
      note: 'Citrus canker',
      entry_id: entryId,
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id,
      end_reason: 'DISEASE_OR_PEST',
      end_note: 'Citrus canker',
      end_entry_id: entryId,
    });
    expect(res.body.data.ended_at).toEqual(expect.any(String));
    const timeline = await a.get(`${base}/timeline`);
    expect(timeline.body.data[0]).toMatchObject({
      type: 'PLANT_ENDED',
      content: 'Citrus canker',
    });
    const tasks = await a.get(`${base}/tasks`);
    const statuses = (tasks.body.data as Array<{ status: string }>).map(
      (t) => t.status,
    );
    expect(statuses).not.toContain('PENDING');
    expect(statuses).toContain('CANCELLED');
  });

  it('ended plants leave the default list and appear under status=ended', async () => {
    const { a, id, base } = await plantWithTask();
    await a.post(`${base}/end`, { reason: 'OLD_AGE' });
    const active = await a.get('/api/v1/ledger/plants');
    expect(active.body.data.map((p: { id: string }) => p.id)).not.toContain(id);
    const ended = await a.get('/api/v1/ledger/plants?status=ended');
    expect(ended.body.data.map((p: { id: string }) => p.id)).toEqual([id]);
  });

  it('refuses growing writes to an ended plant with 409 PLANT_ENDED', async () => {
    const { a, id, base } = await plantWithTask();
    const task = (await a.get(`${base}/tasks`)).body.data[0] as { id: string };
    await a.post(`${base}/end`, { reason: 'WEATHER' });
    const writes = [
      await a.post(`${base}/journal`, { type: 'NOTE', content: 'hello' }),
      await a.put(`${base}/tasks/${task.id}`, { status: 'COMPLETED' }),
      await a.post(`/api/v1/seasonal/plant/${id}/materialize-tasks`),
      await a.put(base, { name: 'New name' }),
      await a.post('/api/v1/vision/diagnose', {
        image_base64: TINY_JPEG_B64,
        plant_id: id,
      }),
    ];
    for (const res of writes) {
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('PLANT_ENDED');
    }
    expect((await a.get(base)).status).toBe(200);
  });

  it('still diagnoses without a plant', async () => {
    const res = await as(alice).post('/api/v1/vision/diagnose', {
      image_base64: TINY_JPEG_B64,
    });
    expect(res.status).toBe(201);
  });

  it('rejects ending twice, a future date, a date before planting, and a foreign entry', async () => {
    const { a, base } = await plantWithTask();
    const other = await plantWithTask(bob);
    const future = new Date(Date.now() + 3 * 864e5).toISOString();
    expect(
      (await a.post(`${base}/end`, { reason: 'WATER', ended_at: future }))
        .status,
    ).toBe(422);
    expect(
      (
        await a.post(`${base}/end`, {
          reason: 'WATER',
          ended_at: '2019-06-01T00:00:00.000Z',
        })
      ).status,
    ).toBe(422);
    expect(
      (await a.post(`${base}/end`, { reason: 'NOT_A_REASON' })).status,
    ).toBe(422);
    expect(
      (
        await a.post(`${base}/end`, {
          reason: 'WATER',
          entry_id: other.entryId,
        })
      ).status,
    ).toBe(404);
    expect((await a.post(`${base}/end`, { reason: 'WATER' })).status).toBe(201);
    const twice = await a.post(`${base}/end`, { reason: 'WATER' });
    expect(twice.status).toBe(409);
    expect(twice.body.error.code).toBe('PLANT_ENDED');
  });

  it('restore brings it back without reviving cancelled tasks; materialize makes fresh ones', async () => {
    const { a, id, base } = await plantWithTask();
    await a.post(`${base}/end`, { reason: 'UNKNOWN_CAUSE' });
    const restored = await a.post(`${base}/restore`);
    expect(restored.status).toBe(201);
    expect(restored.body.data).toMatchObject({
      ended_at: null,
      end_reason: null,
    });
    const active = await a.get('/api/v1/ledger/plants');
    expect(active.body.data.map((p: { id: string }) => p.id)).toContain(id);
    const statuses = (
      (await a.get(`${base}/tasks`)).body.data as Array<{ status: string }>
    ).map((t) => t.status);
    expect(statuses).not.toContain('PENDING');
    const made = await a.post(`/api/v1/seasonal/plant/${id}/materialize-tasks`);
    expect(made.status).toBe(201);
    expect(made.body.data.created_count).toBeGreaterThan(0);
  });

  it('restoring an active plant is 409 PLANT_NOT_ENDED', async () => {
    const { a, base } = await plantWithTask();
    const res = await a.post(`${base}/restore`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PLANT_NOT_ENDED');
  });

  it('links a replacement to the tree it replaces; rejects a living or foreign one', async () => {
    const { a, id, base } = await plantWithTask();
    const living = await a.post('/api/v1/ledger/plants', {
      name: 'Nimbu 2',
      species: 'Lemon',
      replaces_id: id,
    });
    expect(living.status).toBe(409);
    await a.post(`${base}/end`, { reason: 'REPLACED' });
    const foreign = await as(bob).post('/api/v1/ledger/plants', {
      name: 'X',
      species: 'Lemon',
      replaces_id: id,
    });
    expect(foreign.status).toBe(404);
    const created = await a.post('/api/v1/ledger/plants', {
      name: 'Nimbu 2',
      species: 'Lemon',
      replaces_id: id,
    });
    expect(created.status).toBe(201);
    const old = await a.get(base);
    expect(old.body.data.replaced_by_id).toBe(created.body.data.id);
    expect(old.body.data.replaced_by).toMatchObject({
      id: created.body.data.id,
      name: 'Nimbu 2',
    });
    const fresh = await a.get(`/api/v1/ledger/plants/${created.body.data.id}`);
    expect(fresh.body.data.replaces).toEqual([{ id, name: 'Nimbu' }]);
  });
  it('refuses to save a diagnosis to an ended tree through diagnosis/finalize', async () => {
    const { a, id, base } = await plantWithTask();
    await a.post(`${base}/end`, { reason: 'DISEASE_OR_PEST' });
    const before = await prisma.journalEntry.count({ where: { plant_id: id } });
    const res = await a.post('/api/v1/diagnosis/finalize', {
      subject_type: 'TREE',
      subject_id: id,
      primary_issue: 'PEST',
      severity: 'MEDIUM',
      reasoning_summary: 'Aphids',
      recommended_actions: ['Spray neem'],
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PLANT_ENDED');
    expect(await prisma.journalEntry.count({ where: { plant_id: id } })).toBe(
      before,
    );
  });

  it('no task can be created on an ended tree, even by a job queued earlier', async () => {
    const { a, id, base } = await plantWithTask();
    await a.post(`${base}/end`, { reason: 'OLD_AGE' });
    const created = await app.get(TaskRepository).create(alice.id, id, {
      type: 'WATER',
      category: 'WATERING',
      priority: 'MEDIUM',
      title: 'Ghost',
      source: 'MANUAL',
      source_key: 'ghost',
      due_date: new Date(),
    } as never);
    expect(created).toBeNull();
  });

  it('editing a tree never moves its stage backwards', async () => {
    const a = as(alice);
    const plant = await a.post('/api/v1/ledger/plants', {
      name: 'Aam',
      species: 'Mango',
      planting_date: '2021-05',
    });
    const id = plant.body.data.id as string;
    await prisma.plant.update({
      where: { id },
      data: { lifecycle_stage: 'MATURE_BEARING' },
    });
    const renamed = await a.put(`/api/v1/ledger/plants/${id}`, {
      name: 'Bada Aam',
    });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.lifecycle_stage).toBe('MATURE_BEARING');
  });
});
