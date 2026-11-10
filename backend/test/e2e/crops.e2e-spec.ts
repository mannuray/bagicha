import { INestApplication } from '@nestjs/common';
import { PrismaClient, RegionCluster, User } from '@prisma/client';
import request from 'supertest';
import { Clock, FixedClock } from '../../src/common/time';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, ModuleOverrides } from './app';
import { resetDb, seedUser, tokenFor } from './fixtures';

/** A clock the tests can move: crops depend on the date. */
class MovableClock extends FixedClock {
  private at = new Date('2026-10-10T06:00:00Z');
  set(iso: string) {
    this.at = new Date(iso);
  }
  now(): Date {
    return new Date(this.at.getTime());
  }
}

describe('crops', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  let bob: User;
  const clock = new MovableClock(new Date());
  const withClock: ModuleOverrides = (b) =>
    b.overrideProvider(Clock).useValue(clock);

  beforeAll(async () => {
    app = await createTestApp(withClock);
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    clock.set('2026-10-10T06:00:00Z');
    await resetDb(prisma);
    alice = await seedUser(prisma, {
      region_cluster: RegionCluster.EAST_INDIA,
    });
    bob = await seedUser(prisma, { region_cluster: RegionCluster.EAST_INDIA });
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
      del: (url: string) => request(server).delete(url).set(auth),
    };
  };

  describe('calendar', () => {
    it('lists crops with their status for the user’s region', async () => {
      const res = await as(alice).get('/api/v1/crops/calendar');
      expect(res.status).toBe(200);
      const palak = (
        res.body.data as Array<{
          id: string;
          status: string;
          window_label: string;
        }>
      ).find((c) => c.id === 'palak');
      expect(palak).toMatchObject({
        status: 'open',
        family: 'AMARANTHACEAE',
        method: 'DIRECT_SOW',
      });
      expect(palak?.window_label).toBe('Sep–Nov');
      const okra = (
        res.body.data as Array<{ id: string; status: string }>
      ).find((c) => c.id === 'okra');
      expect(okra?.status).toBe('later');
    });

    it('feeds the region’s open crops into the seasonal guide', async () => {
      const res = await as(alice).get('/api/v1/seasonal/guide');
      expect(res.status).toBe(200);
      expect(res.body.data.crops).toContain('Spinach (Palak)');
      expect(res.body.data.crops).not.toContain('Okra');
    });
  });
  describe('garden places', () => {
    it('creates, lists, renames and archives places, owner-scoped', async () => {
      const a = as(alice);
      const bag = await a.post('/api/v1/garden/places', {
        name: 'Terrace bag 3',
        kind: 'GROW_BAG',
      });
      expect(bag.status).toBe(201);
      expect(bag.body.data).toMatchObject({
        name: 'Terrace bag 3',
        kind: 'GROW_BAG',
        archived_at: null,
      });
      await a.post('/api/v1/garden/places', { name: 'Back bed', kind: 'BED' });
      const list = await a.get('/api/v1/garden/places');
      expect(list.body.data.map((p: { name: string }) => p.name)).toEqual([
        'Back bed',
        'Terrace bag 3',
      ]);
      const renamed = await a.put(`/api/v1/garden/places/${bag.body.data.id}`, {
        name: 'Terrace bag A',
      });
      expect(renamed.body.data.name).toBe('Terrace bag A');
      await a.put(`/api/v1/garden/places/${bag.body.data.id}`, {
        archived: true,
      });
      const after = await a.get('/api/v1/garden/places');
      expect(after.body.data.map((p: { name: string }) => p.name)).toEqual([
        'Back bed',
      ]);
      expect(
        (
          await as(bob).put(`/api/v1/garden/places/${bag.body.data.id}`, {
            name: 'Mine',
          })
        ).status,
      ).toBe(404);
      expect(
        (
          await a.post('/api/v1/garden/places', {
            name: 'X',
            kind: 'SPACESHIP',
          })
        ).status,
      ).toBe(422);
    });
  });

  it('tree cycles carry a season number', async () => {
    const a = as(alice);
    const plant = await a.post('/api/v1/ledger/plants', {
      name: 'Aam',
      species: 'Mango',
    });
    await a.post(`/api/v1/ledger/plants/${plant.body.data.id}/journal`, {
      type: 'FLOWERING',
    });
    const cycles = await a.get(
      `/api/v1/ledger/plants/${plant.body.data.id}/cycles`,
    );
    expect(cycles.body.data[0]).toMatchObject({
      season_no: 1,
      closed_at: null,
      place_id: null,
    });
  });
  /** The IST calendar date of an ISO instant. */
  const istDate = (iso: string) =>
    new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

  describe('want to grow', () => {
    it('adds a crop as a planned record, once', async () => {
      const a = as(alice);
      const added = await a.post('/api/v1/crops/plan', { crop_id: 'palak' });
      expect(added.status).toBe(201);
      expect(added.body.data).toMatchObject({
        crop_id: 'palak',
        crop_stage: 'PLANNED',
        record_kind: 'CROP',
        record_pattern: 'RECURRING_SEASONAL',
        growth_habit: 'ANNUAL',
      });
      const again = await a.post('/api/v1/crops/plan', { crop_id: 'palak' });
      expect(again.status).toBe(200);
      expect(again.body.data.id).toBe(added.body.data.id);
      const planned = await a.get('/api/v1/ledger/plants?status=planned');
      expect(planned.body.data.map((p: { id: string }) => p.id)).toEqual([
        added.body.data.id,
      ]);
      const active = await a.get('/api/v1/ledger/plants');
      expect(active.body.data.map((p: { id: string }) => p.id)).not.toContain(
        added.body.data.id,
      );
      expect(
        (await a.post('/api/v1/crops/plan', { crop_id: 'dragonfruit' })).status,
      ).toBe(422);
    });

    it('syncs seed and sow reminders once, never overdue, never repeated', async () => {
      clock.set('2026-08-20T06:00:00Z');
      const a = as(alice);
      const tomato = await a.post('/api/v1/crops/plan', { crop_id: 'tomato' });
      const first = await a.post('/api/v1/crops/plan/sync');
      expect(first.status).toBe(201);
      expect(first.body.data.created_count).toBe(2);
      const tasks = (
        await a.get(`/api/v1/ledger/plants/${tomato.body.data.id}/tasks`)
      ).body.data as Array<{
        id: string;
        title: string;
        due_date: string;
        source: string;
      }>;
      const seeds = tasks.find((t) => /seeds/i.test(t.title))!;
      const sow = tasks.find((t) => /^sow/i.test(t.title))!;
      expect(seeds.source).toBe('CROP_PLAN');
      expect(istDate(seeds.due_date)).toBe('2026-08-20');
      expect(istDate(sow.due_date)).toBe('2026-09-01');
      expect(
        (await a.post('/api/v1/crops/plan/sync')).body.data.created_count,
      ).toBe(0);
      await a.put(
        `/api/v1/ledger/plants/${tomato.body.data.id}/tasks/${seeds.id}`,
        { status: 'COMPLETED' },
      );
      expect(
        (await a.post('/api/v1/crops/plan/sync')).body.data.created_count,
      ).toBe(0);
    });

    it('a crop added mid-window gets reminders due today', async () => {
      clock.set('2026-09-15T06:00:00Z');
      const a = as(alice);
      const tomato = await a.post('/api/v1/crops/plan', { crop_id: 'tomato' });
      await a.post('/api/v1/crops/plan/sync');
      const tasks = (
        await a.get(`/api/v1/ledger/plants/${tomato.body.data.id}/tasks`)
      ).body.data as Array<{ due_date: string }>;
      expect(tasks.map((t) => istDate(t.due_date))).toEqual([
        '2026-09-15',
        '2026-09-15',
      ]);
    });

    it('removes a never-sown crop with its reminders', async () => {
      const a = as(alice);
      const palak = await a.post('/api/v1/crops/plan', { crop_id: 'palak' });
      await a.post('/api/v1/crops/plan/sync');
      const res = await a.del(`/api/v1/crops/plan/${palak.body.data.id}`);
      expect(res.status).toBe(204);
      expect(
        await prisma.task.count({ where: { plant_id: palak.body.data.id } }),
      ).toBe(0);
      expect(
        (await a.get(`/api/v1/ledger/plants/${palak.body.data.id}`)).status,
      ).toBe(404);
      expect(
        (await as(bob).del(`/api/v1/crops/plan/${palak.body.data.id}`)).status,
      ).toBe(404);
    });

    it('keeps older crop records growing, out of the journey', async () => {
      const a = as(alice);
      const legacy = await a.post('/api/v1/ledger/plants', {
        name: 'Bhindi',
        species: 'Okra',
        record_kind: 'CROP',
      });
      const active = await a.get('/api/v1/ledger/plants');
      expect(active.body.data.map((p: { id: string }) => p.id)).toContain(
        legacy.body.data.id,
      );
      expect(
        (await a.post('/api/v1/crops/plan/sync')).body.data.created_count,
      ).toBe(0);
      expect(
        (
          await a.post(
            `/api/v1/seasonal/plant/${legacy.body.data.id}/materialize-tasks`,
          )
        ).status,
      ).toBe(201);
    });

    it('never runs the tree season pack on a journey crop', async () => {
      const a = as(alice);
      const palak = await a.post('/api/v1/crops/plan', { crop_id: 'palak' });
      const res = await a.post(
        `/api/v1/seasonal/plant/${palak.body.data.id}/materialize-tasks`,
      );
      expect(res.status).toBe(201);
      expect(res.body.data).toEqual({ results: [], created_count: 0 });
    });
  });
});
