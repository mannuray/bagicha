import { INestApplication } from '@nestjs/common';
import { PrismaClient, RegionCluster, User } from '@prisma/client';
import request from 'supertest';
import { Clock, FixedClock } from '../../src/common/time';
import { FLOWER_CLEANUP_SQL } from '../../src/modules/plant-ledger/domain/flower-care';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, ModuleOverrides } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

class MovableClock extends FixedClock {
  private at = new Date('2026-09-20T06:00:00Z');
  set(iso: string) {
    this.at = new Date(iso);
  }
  now(): Date {
    return new Date(this.at.getTime());
  }
}

describe('perennial flowers', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  const clock = new MovableClock(new Date());
  const withClock: ModuleOverrides = (b) =>
    b.overrideProvider(Clock).useValue(clock);

  beforeAll(async () => {
    app = await createTestApp(withClock);
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    clock.set('2026-09-20T06:00:00Z');
    await resetDb(prisma);
    alice = await seedUser(prisma, {
      region_cluster: RegionCluster.EAST_INDIA,
    });
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
  const addFlower = async (species: string) =>
    (
      await as(alice).post('/api/v1/ledger/plants', {
        name: species,
        species,
        record_kind: 'FLOWER',
      })
    ).body.data;
  const materialize = async (id: string) =>
    (await as(alice).post(`/api/v1/seasonal/plant/${id}/materialize-tasks`))
      .body.data;
  // Every new plant gets a generic "water it in" SYSTEM task; these tests look at the rest.
  type Task = { id: string; source: string; title: string; status: string };
  // Every new plant gets a generic "water it in" SYSTEM task; these tests look at the rest.
  const tasksOf = async (id: string) =>
    (
      (await as(alice).get(`/api/v1/ledger/plants/${id}/tasks`)).body
        .data as Task[]
    ).filter((t) => t.source !== 'SYSTEM');

  it('materializes rose care, never the fruit pack, and not twice in a year', async () => {
    const rose = await addFlower('Rose');
    expect((await materialize(rose.id)).created_count).toBe(1);
    let tasks = await tasksOf(rose.id);
    expect(tasks.map((t) => t.source)).toEqual(['FLOWER_CARE']);
    expect(tasks[0].title).toMatch(/prune the rose/i);
    await as(alice).put(
      `/api/v1/ledger/plants/${rose.id}/tasks/${tasks[0].id}`,
      { status: 'COMPLETED' },
    );
    expect((await materialize(rose.id)).created_count).toBe(0);
    clock.set('2027-09-20T06:00:00Z');
    expect((await materialize(rose.id)).created_count).toBe(1);
    tasks = await tasksOf(rose.id);
    expect(tasks.every((t) => t.source === 'FLOWER_CARE')).toBe(true);
  });

  it('an unknown flower gets no tasks and no bloom status', async () => {
    const lotus = await addFlower('Lotus');
    expect((await materialize(lotus.id)).created_count).toBe(0);
    expect(
      (await as(alice).get(`/api/v1/ledger/plants/${lotus.id}`)).body.data
        .bloom,
    ).toBeNull();
  });

  it('detail carries bloom status for a known perennial', async () => {
    const mogra = await addFlower('Mogra');
    const detail = (await as(alice).get(`/api/v1/ledger/plants/${mogra.id}`))
      .body.data;
    expect(detail.bloom).toEqual({ status: 'later', window_label: 'Mar–Jun' });
  });

  it('cancels pending fruit-pack tasks on existing flowers, keeping history', async () => {
    const rose = await addFlower('Rose');
    const base = {
      plant_id: rose.id,
      type: 'OBSERVE' as const,
      priority: 'MEDIUM' as const,
      due_date: new Date(),
    };
    const pending = await prisma.task.create({
      data: {
        ...base,
        source: 'SEASONAL_PACK',
        source_key: 'fruit_set',
        status: 'PENDING',
        title: 'Watch fruit set',
      },
    });
    const done = await prisma.task.create({
      data: {
        ...base,
        source: 'SEASONAL_PACK',
        source_key: 'water',
        status: 'COMPLETED',
        title: 'Water deeply',
      },
    });
    await prisma.$executeRawUnsafe(FLOWER_CLEANUP_SQL);
    expect(
      (await prisma.task.findUnique({ where: { id: pending.id } }))?.status,
    ).toBe('CANCELLED');
    expect(
      (await prisma.task.findUnique({ where: { id: done.id } }))?.status,
    ).toBe('COMPLETED');
  });

  it('stores a flower added with an old planting date as blooming, never bearing', async () => {
    const res = await as(alice).post('/api/v1/ledger/plants', {
      name: 'Gulab',
      species: 'Rose',
      record_kind: 'FLOWER',
      planting_date: '2015',
      planting_date_precision: 'YEAR',
    });
    expect(res.body.data.lifecycle_stage).toBe('FIRST_FLOWERING');
  });

  it('creates every feed of the year for a hibiscus', async () => {
    clock.set('2026-03-05T06:00:00Z');
    const hibiscus = await addFlower('Hibiscus');
    expect((await materialize(hibiscus.id)).created_count).toBeGreaterThan(0);
    clock.set('2026-05-05T06:00:00Z');
    await materialize(hibiscus.id);
    const feeds = (await tasksOf(hibiscus.id)).filter((t) =>
      /feed/i.test(t.title),
    );
    expect(feeds.length).toBeGreaterThanOrEqual(2);
  });
});
