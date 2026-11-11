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
  describe('the planting journey', () => {
    type Task = {
      id: string;
      title: string;
      status: string;
      due_date: string;
      source: string;
    };
    const tasksOf = async (a: ReturnType<typeof as>, id: string) =>
      (await a.get(`/api/v1/ledger/plants/${id}/tasks`)).body.data as Task[];
    const plantOf = async (a: ReturnType<typeof as>, id: string) =>
      (await a.get(`/api/v1/ledger/plants/${id}`)).body.data;
    const log = (
      a: ReturnType<typeof as>,
      id: string,
      type: string,
      metadata?: object,
    ) =>
      a.post(`/api/v1/ledger/plants/${id}/journal`, {
        type,
        ...(metadata ? { metadata } : {}),
      });

    it('nursery crop: sowing opens a season in the nursery; transplanting moves it to the bed', async () => {
      const a = as(alice);
      const tomato = (await a.post('/api/v1/crops/plan', { crop_id: 'tomato' }))
        .body.data;
      await a.post('/api/v1/crops/plan/sync');
      expect(
        (await log(a, tomato.id, 'SOWING', { method: 'NURSERY' })).status,
      ).toBe(201);
      expect((await plantOf(a, tomato.id)).crop_stage).toBe('NURSERY');
      let tasks = await tasksOf(a, tomato.id);
      expect(
        tasks
          .filter((t) => /seeds|^sow/i.test(t.title))
          .every((t) => t.status === 'COMPLETED'),
      ).toBe(true);
      const germ = tasks.find((t) => /come up/i.test(t.title))!;
      expect(istDate(germ.due_date)).toBe('2026-10-20');
      expect(tasks.find((t) => /transplant/i.test(t.title))).toBeTruthy();
      expect(tasks.find((t) => /ready to pick/i.test(t.title))).toBeTruthy();
      const cycles = (await a.get(`/api/v1/ledger/plants/${tomato.id}/cycles`))
        .body.data;
      expect(cycles[0]).toMatchObject({ season_no: 1, closed_at: null });

      clock.set('2026-11-08T06:00:00Z');
      await log(a, tomato.id, 'TRANSPLANTING');
      expect((await plantOf(a, tomato.id)).crop_stage).toBe('IN_GROUND');
      tasks = await tasksOf(a, tomato.id);
      expect(tasks.find((t) => /transplant/i.test(t.title))?.status).toBe(
        'COMPLETED',
      );
      expect(istDate(tasks.find((t) => /stake/i.test(t.title))!.due_date)).toBe(
        '2026-11-28',
      );
    });

    it('lists plants by kind, with the open season start for growing crops', async () => {
      const a = as(alice);
      const tree = (
        await a.post('/api/v1/ledger/plants', { name: 'Aam', species: 'Mango' })
      ).body.data;
      const palak = (await a.post('/api/v1/crops/plan', { crop_id: 'palak' }))
        .body.data;
      await log(a, palak.id, 'SOWING', { method: 'DIRECT' });
      const crops = (await a.get('/api/v1/ledger/plants?kind=crop')).body.data;
      expect(crops.map((p: { id: string }) => p.id)).toEqual([palak.id]);
      expect(crops[0].season_started_at).toEqual(expect.any(String));
      const trees = (await a.get('/api/v1/ledger/plants?kind=tree')).body.data;
      expect(trees.map((p: { id: string }) => p.id)).toEqual([tree.id]);
      expect(trees[0].season_started_at).toBeNull();
      expect((await a.get('/api/v1/ledger/plants?kind=shrub')).status).toBe(
        422,
      );
    });

    it('direct crop: sows straight into a place, with thinning and no transplant', async () => {
      const a = as(alice);
      const bag = (
        await a.post('/api/v1/garden/places', {
          name: 'Terrace bag',
          kind: 'GROW_BAG',
        })
      ).body.data;
      const palak = (await a.post('/api/v1/crops/plan', { crop_id: 'palak' }))
        .body.data;
      await log(a, palak.id, 'SOWING', { method: 'DIRECT', place_id: bag.id });
      expect((await plantOf(a, palak.id)).crop_stage).toBe('IN_GROUND');
      const tasks = await tasksOf(a, palak.id);
      expect(tasks.find((t) => /thin/i.test(t.title))).toBeTruthy();
      expect(tasks.find((t) => /transplant/i.test(t.title))).toBeUndefined();
      expect(tasks.find((t) => /another row/i.test(t.title))).toBeTruthy();
      const cycles = (await a.get(`/api/v1/ledger/plants/${palak.id}/cycles`))
        .body.data;
      expect(cycles[0].place_id).toBe(bag.id);
      expect(
        (
          await log(a, palak.id, 'SOWING', {
            method: 'DIRECT',
            place_id: 'not-mine',
          })
        ).status,
      ).toBe(201); // open season: place ignored
    });

    it('bought seedlings: transplanting from planned skips the earlier steps', async () => {
      const a = as(alice);
      const brinjal = (
        await a.post('/api/v1/crops/plan', { crop_id: 'brinjal' })
      ).body.data;
      clock.set('2026-10-20T06:00:00Z');
      await a.post('/api/v1/crops/plan/sync');
      await log(a, brinjal.id, 'TRANSPLANTING');
      expect((await plantOf(a, brinjal.id)).crop_stage).toBe('IN_GROUND');
      const tasks = await tasksOf(a, brinjal.id);
      expect(
        tasks.filter((t) => /seeds|^sow/i.test(t.title)).map((t) => t.status),
      ).toEqual(['COMPLETED', 'COMPLETED']);
    });

    it('a first log of harvest opens a season and totals the yield', async () => {
      const a = as(alice);
      const okra = (await a.post('/api/v1/crops/plan', { crop_id: 'okra' }))
        .body.data;
      await log(a, okra.id, 'HARVEST', {
        quantity_value: 1.5,
        quantity_unit: 'kg',
      });
      await log(a, okra.id, 'HARVEST', {
        quantity_value: 2,
        quantity_unit: 'kg',
      });
      expect((await plantOf(a, okra.id)).crop_stage).toBe('HARVESTING');
      const cycles = (await a.get(`/api/v1/ledger/plants/${okra.id}/cycles`))
        .body.data;
      expect(cycles).toHaveLength(1);
      expect(cycles[0].yield_quantity).toBe(3.5);
    });

    it('a second sowing in an open season is a succession row, not a step back', async () => {
      const a = as(alice);
      const palak = (await a.post('/api/v1/crops/plan', { crop_id: 'palak' }))
        .body.data;
      await log(a, palak.id, 'SOWING', { method: 'DIRECT' });
      await log(a, palak.id, 'HARVEST');
      const before = (await tasksOf(a, palak.id)).filter((t) =>
        /come up/i.test(t.title),
      ).length;
      clock.set('2026-10-26T06:00:00Z');
      await log(a, palak.id, 'SOWING', { method: 'DIRECT' });
      expect((await plantOf(a, palak.id)).crop_stage).toBe('HARVESTING');
      const tasks = await tasksOf(a, palak.id);
      expect(tasks.filter((t) => /come up/i.test(t.title))).toHaveLength(
        before,
      );
      expect(
        tasks.filter(
          (t) => /another row/i.test(t.title) && t.status === 'COMPLETED',
        ).length,
      ).toBeGreaterThan(0);
    });

    it('season end rests the crop, closes the season and cancels leftover steps; a new season numbers on', async () => {
      const a = as(alice);
      const palak = (await a.post('/api/v1/crops/plan', { crop_id: 'palak' }))
        .body.data;
      await log(a, palak.id, 'SOWING', { method: 'DIRECT' });
      await log(a, palak.id, 'SEASON_END');
      expect((await plantOf(a, palak.id)).crop_stage).toBe('RESTING');
      const tasks = await tasksOf(a, palak.id);
      expect(tasks.filter((t) => t.status === 'PENDING')).toHaveLength(0);
      let cycles = (await a.get(`/api/v1/ledger/plants/${palak.id}/cycles`))
        .body.data;
      expect(cycles[0].closed_at).toEqual(expect.any(String));
      const planned = await a.get('/api/v1/ledger/plants?status=planned');
      expect(planned.body.data.map((p: { id: string }) => p.id)).toContain(
        palak.id,
      );
      clock.set('2026-11-05T06:00:00Z');
      await log(a, palak.id, 'SOWING', { method: 'DIRECT' });
      cycles = (await a.get(`/api/v1/ledger/plants/${palak.id}/cycles`)).body
        .data;
      expect(cycles.map((c: { season_no: number }) => c.season_no)).toEqual([
        2, 1,
      ]);
    });

    it('a note on a planned crop opens no season, so it can still be removed', async () => {
      const a = as(alice);
      const palak = (await a.post('/api/v1/crops/plan', { crop_id: 'palak' }))
        .body.data;
      expect((await log(a, palak.id, 'NOTE')).status).toBe(201);
      expect(
        (await a.get(`/api/v1/ledger/plants/${palak.id}/cycles`)).body.data,
      ).toHaveLength(0);
      expect((await a.del(`/api/v1/crops/plan/${palak.id}`)).status).toBe(204);
    });

    it('refuses a place that is not the user’s when opening a season', async () => {
      const a = as(alice);
      const bobsBag = (
        await as(bob).post('/api/v1/garden/places', {
          name: 'Bob bag',
          kind: 'GROW_BAG',
        })
      ).body.data;
      const palak = (await a.post('/api/v1/crops/plan', { crop_id: 'palak' }))
        .body.data;
      expect(
        (
          await log(a, palak.id, 'SOWING', {
            method: 'DIRECT',
            place_id: bobsBag.id,
          })
        ).status,
      ).toBe(404);
      expect((await plantOf(a, palak.id)).crop_stage).toBe('PLANNED');
    });
  });
  describe('rotation', () => {
    it('warns when the same family grew in a place within the last year', async () => {
      const a = as(alice);
      const bag = (
        await a.post('/api/v1/garden/places', {
          name: 'Bag A',
          kind: 'GROW_BAG',
        })
      ).body.data;
      clock.set('2026-10-20T06:00:00Z');
      const potato = (await a.post('/api/v1/crops/plan', { crop_id: 'potato' }))
        .body.data;
      await a.post(`/api/v1/ledger/plants/${potato.id}/journal`, {
        type: 'SOWING',
        metadata: { place_id: bag.id },
      });
      clock.set('2027-02-20T06:00:00Z');
      await a.post(`/api/v1/ledger/plants/${potato.id}/journal`, {
        type: 'SEASON_END',
      });
      clock.set('2027-09-10T06:00:00Z');
      const tomato = await a.get(
        `/api/v1/garden/places/${bag.id}/rotation?crop_id=tomato`,
      );
      expect(tomato.status).toBe(200);
      expect(tomato.body.data).toMatchObject({
        conflict: true,
        last: {
          crop_id: 'potato',
          family: 'SOLANACEAE',
          season_label: 'Oct 2026',
        },
      });
      const beans = await a.get(
        `/api/v1/garden/places/${bag.id}/rotation?crop_id=french_beans`,
      );
      expect(beans.body.data.conflict).toBe(false);
      expect(
        (
          await as(bob).get(
            `/api/v1/garden/places/${bag.id}/rotation?crop_id=tomato`,
          )
        ).status,
      ).toBe(404);
      clock.set('2028-03-01T06:00:00Z');
      expect(
        (await a.get(`/api/v1/garden/places/${bag.id}/rotation?crop_id=tomato`))
          .body.data,
      ).toEqual({ conflict: false, last: null });
    });
  });
  describe('final review fixes', () => {
    type Task = { id: string; title: string; status: string; due_date: string };
    const tasksOf = async (a: ReturnType<typeof as>, id: string) =>
      (await a.get(`/api/v1/ledger/plants/${id}/tasks`)).body.data as Task[];

    it('records the bed chosen at transplant for a nursery crop', async () => {
      const a = as(alice);
      const bed = (
        await a.post('/api/v1/garden/places', { name: 'Back bed', kind: 'BED' })
      ).body.data;
      const tomato = (await a.post('/api/v1/crops/plan', { crop_id: 'tomato' }))
        .body.data;
      await a.post(`/api/v1/ledger/plants/${tomato.id}/journal`, {
        type: 'SOWING',
        metadata: { method: 'NURSERY' },
      });
      clock.set('2026-11-08T06:00:00Z');
      await a.post(`/api/v1/ledger/plants/${tomato.id}/journal`, {
        type: 'TRANSPLANTING',
        metadata: { place_id: bed.id },
      });
      const cycles = (await a.get(`/api/v1/ledger/plants/${tomato.id}/cycles`))
        .body.data;
      expect(cycles[0].place_id).toBe(bed.id);
      const bobsBed = (
        await as(bob).post('/api/v1/garden/places', { name: 'B', kind: 'BED' })
      ).body.data;
      const chilli = (await a.post('/api/v1/crops/plan', { crop_id: 'chilli' }))
        .body.data;
      await a.post(`/api/v1/ledger/plants/${chilli.id}/journal`, {
        type: 'SOWING',
        metadata: { method: 'NURSERY' },
      });
      expect(
        (
          await a.post(`/api/v1/ledger/plants/${chilli.id}/journal`, {
            type: 'TRANSPLANTING',
            metadata: { place_id: bobsBed.id },
          })
        ).status,
      ).toBe(404);
    });

    it('keeps one pending "sow another row" however often you harvest', async () => {
      const a = as(alice);
      const palak = (await a.post('/api/v1/crops/plan', { crop_id: 'palak' }))
        .body.data;
      await a.post(`/api/v1/ledger/plants/${palak.id}/journal`, {
        type: 'SOWING',
        metadata: { method: 'DIRECT' },
      });
      clock.set('2026-10-13T06:00:00Z');
      await a.post(`/api/v1/ledger/plants/${palak.id}/journal`, {
        type: 'HARVEST',
      });
      clock.set('2026-10-16T06:00:00Z');
      await a.post(`/api/v1/ledger/plants/${palak.id}/journal`, {
        type: 'HARVEST',
      });
      const rows = (await tasksOf(a, palak.id)).filter(
        (t) => /another row/i.test(t.title) && t.status === 'PENDING',
      );
      expect(rows).toHaveLength(1);
    });

    it('retires sow reminders once their window has closed, and plans the next window', async () => {
      clock.set('2026-08-20T06:00:00Z');
      const a = as(alice);
      const tomato = (await a.post('/api/v1/crops/plan', { crop_id: 'tomato' }))
        .body.data;
      await a.post('/api/v1/crops/plan/sync');
      clock.set('2026-11-15T06:00:00Z');
      await a.post('/api/v1/crops/plan/sync');
      const tasks = await tasksOf(a, tomato.id);
      const pending = tasks.filter((t) => t.status === 'PENDING');
      expect(pending.map((t) => istDate(t.due_date)).sort()).toEqual([
        '2026-12-11',
        '2027-01-01',
      ]);
      expect(tasks.filter((t) => t.status === 'CANCELLED')).toHaveLength(2);
    });

    it('ending a season that never started changes nothing', async () => {
      const a = as(alice);
      const palak = (await a.post('/api/v1/crops/plan', { crop_id: 'palak' }))
        .body.data;
      await a.post('/api/v1/crops/plan/sync');
      await a.post(`/api/v1/ledger/plants/${palak.id}/journal`, {
        type: 'SEASON_END',
      });
      expect(
        (await a.get(`/api/v1/ledger/plants/${palak.id}`)).body.data.crop_stage,
      ).toBe('PLANNED');
      expect(
        (await tasksOf(a, palak.id)).filter((t) => t.status === 'PENDING'),
      ).toHaveLength(2);
    });
  });
  describe('crop detail and sunlight', () => {
    it('returns a crop’s full detail for the user’s region', async () => {
      const res = await as(alice).get('/api/v1/crops/calendar/tomato');
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: 'tomato',
        sun: 'FULL',
        scientific_name: 'Solanum lycopersicum',
        transplant_after_days: [25, 30],
        germination_days: [5, 10],
      });
      expect(res.body.data.care.map((c: { key: string }) => c.key)).toContain(
        'stake',
      );
      expect(
        res.body.data.windows.map((w: { label: string }) => w.label),
      ).toEqual(['Sep–Oct', 'Jan–Feb']);
      expect(
        (await as(alice).get('/api/v1/crops/calendar/dragonfruit')).status,
      ).toBe(404);
    });

    it('lists sun needs in the calendar and keeps a place’s sunlight', async () => {
      const list = await as(alice).get('/api/v1/crops/calendar');
      expect(
        list.body.data.find((c: { id: string }) => c.id === 'palak'),
      ).toMatchObject({ sun: 'PARTIAL' });
      const place = await as(alice).post('/api/v1/garden/places', {
        name: 'Balcony',
        kind: 'POT',
        sun_hours: 'PARTIAL',
      });
      expect(place.body.data.sun_hours).toBe('PARTIAL');
      const updated = await as(alice).put(
        `/api/v1/garden/places/${place.body.data.id}`,
        { sun_hours: 'FULL' },
      );
      expect(updated.body.data.sun_hours).toBe('FULL');
    });
  });
});
