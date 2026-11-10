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
});
