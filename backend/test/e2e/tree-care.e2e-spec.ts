import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import {
  TREE_CARE_REGISTRY,
  type FamilyCare,
} from '../../src/modules/plant-ledger';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

/** A care family open all year, so the tests don't depend on today's date. */
const FIXTURE: FamilyCare = {
  family: 'mango',
  sources: ['test'],
  grownIn: ['EAST_INDIA', 'NORTH_INDIA', 'CENTRAL_INDIA'],
  // Grown there, but its calendar isn't verified yet: keeps the season pack.
  pendingRegions: ['CENTRAL_INDIA'],
  regions: {
    EAST_INDIA: {
      items: [
        {
          key: 'feed',
          title: 'Feed the tree',
          category: 'FEEDING',
          stages: ['YOUNG', 'BEARING'],
          when: { kind: 'CALENDAR', from: [1, 1], to: [12, 31] },
          organic: 'Compost 25 kg + neem cake 1 kg',
          chemical: 'Urea 500 g; wear gloves; not within 15 days of picking',
          dose: {
            organic: [{ what: 'FYM', grams: 5000 }],
            chemical: [{ what: 'urea', grams: 110 }],
            maxAgeYears: 10,
          },
          why: 'Builds next season’s shoots',
        },
        ...(['spray', 'prune', 'look'] as const).map((key, i) => ({
          key,
          title: `Do ${key}`,
          category: (['PROTECTION', 'PRUNING', 'GENERAL'] as const)[i],
          stages: ['BEARING' as const],
          when: {
            kind: 'CALENDAR' as const,
            from: [1, 1] as [number, number],
            to: [12, 31] as [number, number],
          },
          organic: `organic ${key}`,
          why: `why ${key}`,
        })),
        {
          key: 'borer',
          title: 'Treat borer holes',
          category: 'PROTECTION',
          stages: ['BEARING'],
          conditional: 'Holes with sawdust on the trunk',
          when: { kind: 'CALENDAR', from: [1, 1], to: [12, 31] },
          organic: 'Hook out the grub; plug with cotton',
          why: 'Borers hollow the trunk',
        },
        {
          key: 'young_only',
          title: 'Pick off flowers',
          category: 'GENERAL',
          stages: ['YOUNG'],
          when: { kind: 'CALENDAR', from: [1, 1], to: [12, 31] },
          organic: 'Remove flower bunches',
          why: 'Fruiting early stunts the tree',
        },
      ],
      phases: [
        {
          when: { kind: 'CALENDAR', from: [1, 1], to: [12, 31] },
          stages: ['YOUNG', 'BEARING'],
          phase: 'fixture_phase',
          avoid: ['No urea now'],
          watch: ['Hoppers'],
        },
      ],
    },
    NORTH_INDIA: { sameAs: 'EAST_INDIA' },
  },
};

describe('tree care families', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;

  beforeAll(async () => {
    app = await createTestApp((b) =>
      b.overrideProvider(TREE_CARE_REGISTRY).useValue({ mango: FIXTURE }),
    );
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma, {
      district: 'Patna',
      region_cluster: 'EAST_INDIA',
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
    };
  };
  const mango = () =>
    seedPlant(prisma, alice.id, {
      species: 'Mango',
      species_family: 'mango',
      lifecycle_stage: 'MATURE_BEARING',
    });
  const materialize = (id: string, user = alice) =>
    as(user).post(`/api/v1/seasonal/plant/${id}/materialize-tasks`);
  type TaskRow = {
    title: string;
    source: string;
    status: string;
    care_how: {
      organic: string;
      chemical: string | null;
      why: string;
      amount: string | null;
    } | null;
  };
  const tasks = async (id: string, user = alice) =>
    (await as(user).get(`/api/v1/ledger/plants/${id}/tasks`)).body
      .data as TaskRow[];

  it('a care family gets TREE_CARE reminders with how-to on the task', async () => {
    const plant = await mango();
    expect((await materialize(plant.id)).status).toBe(201);
    const care = (await tasks(plant.id)).filter(
      (t) => t.source === 'TREE_CARE',
    );
    // Four items are open; the cap keeps three, by priority (feeding is one of them).
    expect(care).toHaveLength(3);
    const feed = care.find((t) => t.title === 'Feed the tree');
    expect(feed?.care_how).toMatchObject({
      organic: 'Compost 25 kg + neem cake 1 kg',
      chemical: 'Urea 500 g; wear gloves; not within 15 days of picking',
      why: 'Builds next season’s shoots',
    });
  });

  it('mango moves from pack tasks to care tasks once', async () => {
    const plant = await mango();
    await prisma.task.create({
      data: {
        plant_id: plant.id,
        type: 'INSPECT',
        priority: 'MEDIUM',
        source: 'SEASONAL_PACK',
        source_key: 'oldpack:seasonal_primary_action',
        due_date: new Date(),
      },
    });
    await materialize(plant.id);
    await materialize(plant.id);
    const all = await tasks(plant.id);
    expect(
      all.filter((t) => t.source === 'SEASONAL_PACK').map((t) => t.status),
    ).toEqual(['CANCELLED']);
    expect(all.filter((t) => t.source === 'TREE_CARE')).toHaveLength(3);
  });

  it('intelligence for a care family reads the phase from care data', async () => {
    const plant = await mango();
    const res = await as(alice).get(
      `/api/v1/seasonal/plant/${plant.id}/intelligence`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.seasonal_pack).toMatchObject({
      current_phase: 'fixture_phase',
      avoid_now: ['No urea now'],
      watch_for: ['Hoppers'],
      do_now: expect.arrayContaining(['Feed the tree']),
      confidence: 'high',
    });
    expect(res.body.data.care_note).toBeNull();
  });

  it('a gardener outside grownIn gets care with the note', async () => {
    const bob = await seedUser(prisma, {
      district: 'Mysuru',
      region_cluster: 'SOUTH_DECCAN',
    });
    const plant = await seedPlant(prisma, bob.id, {
      species: 'Mango',
      species_family: 'mango',
      lifecycle_stage: 'MATURE_BEARING',
    });
    const res = await as(bob).get(
      `/api/v1/seasonal/plant/${plant.id}/intelligence`,
    );
    expect(res.body.data.care_note).toBe(
      'Not usually grown in your region; timings may differ.',
    );
    await materialize(plant.id, bob);
    expect(
      (await tasks(plant.id, bob)).some((t) => t.source === 'TREE_CARE'),
    ).toBe(true);
  });

  it('pending family keeps season pack behaviour', async () => {
    const guava = await seedPlant(prisma, alice.id, {
      species: 'Guava',
      species_family: 'guava',
      lifecycle_stage: 'MATURE_BEARING',
    });
    await materialize(guava.id);
    const sources = (await tasks(guava.id)).map((t) => t.source);
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((s) => s === 'SEASONAL_PACK')).toBe(true);
    const res = await as(alice).get(
      `/api/v1/seasonal/plant/${guava.id}/intelligence`,
    );
    expect(res.body.data.seasonal_pack.current_phase).not.toBe('fixture_phase');
    expect(res.body.data.care_note).toBeNull();
  });

  it("paid overlay still adjusts a care family's phase on dryness", async () => {
    const paid = await seedUser(prisma, {
      district: 'Patna',
      region_cluster: 'EAST_INDIA',
      subscription_tier: 'PREMIUM',
      premium_expires_at: null,
    });
    const plant = await seedPlant(prisma, paid.id, {
      species: 'Mango',
      species_family: 'mango',
      lifecycle_stage: 'MATURE_BEARING',
    });
    await as(paid).post(`/api/v1/ledger/plants/${plant.id}/journal`, {
      type: 'NOTE',
      content: 'soil very dry, leaves drooping',
    });
    const res = await as(paid).get(
      `/api/v1/seasonal/plant/${plant.id}/intelligence`,
    );
    expect(res.body.data.personalized_overlay.adjusted_phase).toBe(
      'fixture_phase_with_dryness_attention',
    );
    await materialize(plant.id, paid);
    const sources = (await tasks(plant.id, paid)).map((t) => t.source);
    expect(sources).toContain('PERSONALIZED_OVERLAY');
    expect(sources).toContain('TREE_CARE');
  });

  const year = () => new Date(Date.now() + 5.5 * 3600 * 1000).getUTCFullYear();
  const pendingCare = async (id: string) =>
    (await tasks(id)).filter(
      (t) => t.source === 'TREE_CARE' && t.status === 'PENDING',
    );

  it('a tree never holds more than 3 care reminders across refreshes', async () => {
    const plant = await mango();
    // "look" (lowest priority) was reminded on an earlier day and is still pending.
    await prisma.task.create({
      data: {
        plant_id: plant.id,
        type: 'OBSERVE',
        priority: 'MEDIUM',
        source: 'TREE_CARE',
        source_key: `mango:look:${year()}-01-01`,
        due_date: new Date(),
        metadata: { organic: 'organic look', why: 'why look' },
      },
    });
    await materialize(plant.id);
    await materialize(plant.id);
    expect(await pendingCare(plant.id)).toHaveLength(3);
  });

  it('retires stale care reminders: a passed window, and young-tree care once the tree bears', async () => {
    const plant = await seedPlant(prisma, alice.id, {
      species: 'Mango',
      species_family: 'mango',
      lifecycle_stage: 'SAPLING',
    });
    await prisma.task.create({
      data: {
        plant_id: plant.id,
        type: 'FEED',
        priority: 'MEDIUM',
        source: 'TREE_CARE',
        source_key: 'mango:feed:2020-01-01',
        due_date: new Date('2020-01-01'),
        metadata: { organic: 'old', why: 'old' },
      },
    });
    await materialize(plant.id);
    const statusOf = async (key: string) =>
      (
        await prisma.task.findFirst({
          where: { plant_id: plant.id, source_key: key },
        })
      )?.status;
    expect(await statusOf('mango:feed:2020-01-01')).toBe('CANCELLED');
    expect(await statusOf(`mango:young_only:${year()}-01-01`)).toBe('PENDING');

    await prisma.plant.update({
      where: { id: plant.id },
      data: { lifecycle_stage: 'MATURE_BEARING' },
    });
    await materialize(plant.id);
    expect(await statusOf(`mango:young_only:${year()}-01-01`)).toBe(
      'CANCELLED',
    );
  });

  it('the plant page lists this month\'s care with how-to, including capped and "if you see it" items', async () => {
    const plant = await mango();
    const res = await as(alice).get(
      `/api/v1/seasonal/plant/${plant.id}/intelligence`,
    );
    const month = res.body.data.care_this_month as Array<{
      title: string;
      organic: string;
      if_you_see: string | null;
    }>;
    expect(month.map((m) => m.title)).toEqual(
      expect.arrayContaining([
        'Do spray',
        'Feed the tree',
        'Do prune',
        'Do look',
        'Treat borer holes',
      ]),
    );
    expect(month.find((m) => m.title === 'Treat borer holes')).toMatchObject({
      organic: 'Hook out the grub; plug with cotton',
      if_you_see: 'Holes with sawdust on the trunk',
    });
  });

  it('a pending family has no care list', async () => {
    const guava = await seedPlant(prisma, alice.id, {
      species: 'Guava',
      species_family: 'guava',
    });
    const res = await as(alice).get(
      `/api/v1/seasonal/plant/${guava.id}/intelligence`,
    );
    expect(res.body.data.care_this_month).toEqual([]);
  });

  it('a gardener in a region still pending verification keeps the season pack', async () => {
    const cara = await seedUser(prisma, {
      district: 'Bhopal',
      region_cluster: 'CENTRAL_INDIA',
    });
    const plant = await seedPlant(prisma, cara.id, {
      species: 'Mango',
      species_family: 'mango',
      lifecycle_stage: 'MATURE_BEARING',
    });
    await materialize(plant.id, cara);
    const sources = (await tasks(plant.id, cara)).map((t) => t.source);
    expect(sources).not.toContain('TREE_CARE');
    expect(sources).toContain('SEASONAL_PACK');
    const res = await as(cara).get(
      `/api/v1/seasonal/plant/${plant.id}/intelligence`,
    );
    expect(res.body.data.seasonal_pack.current_phase).not.toBe('fixture_phase');
    expect(res.body.data.care_this_month).toEqual([]);
  });
});
