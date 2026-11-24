import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import {
  CATALOGUE_SEED,
  CatalogueStore,
  type CareKind,
  type TreeCareSeed,
} from '../../src/modules/catalogue';
import { seededCatalogueStore } from '../../src/modules/catalogue/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

/** A kind with one reminder open all year, titled after the kind. */
const kind = (key: string, words: string[]): CareKind => ({
  key,
  words,
  grownIn: ['EAST_INDIA'],
  regions: {
    EAST_INDIA: {
      items: [
        {
          key: 'feed',
          title: `Feed the ${key}`,
          category: 'FEEDING',
          stages: ['YOUNG', 'BEARING'],
          when: { kind: 'CALENDAR', from: [1, 1], to: [12, 31] },
          organic: 'Compost 10 kg',
          why: 'Keeps it cropping',
        },
      ],
      phases: [],
    },
  },
});

const CITRUS: TreeCareSeed = {
  family: 'citrus',
  sources: ['test'],
  grownIn: [],
  regions: {},
  kinds: [kind('lime', ['kagzi']), kind('mandarin', ['kinnow'])],
  status: 'APPROVED',
  notes: null,
};

describe('tree care by kind (citrus)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;

  beforeAll(async () => {
    app = await createTestApp((b) =>
      b.overrideProvider(CatalogueStore).useValue(
        seededCatalogueStore({
          ...CATALOGUE_SEED,
          treeCare: [
            ...CATALOGUE_SEED.treeCare.filter((c) => c.family !== 'citrus'),
            CITRUS,
          ],
        }),
      ),
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

  const as = () => {
    const auth = { Authorization: `Bearer ${tokenFor(app, alice)}` };
    const server = app.getHttpServer();
    return {
      get: (url: string) => request(server).get(url).set(auth),
      post: (url: string) => request(server).post(url).set(auth).send({}),
    };
  };
  const materialize = (id: string) =>
    as().post(`/api/v1/seasonal/plant/${id}/materialize-tasks`);
  const pendingCare = async (id: string) =>
    (
      (await as().get(`/api/v1/ledger/plants/${id}/tasks`)).body.data as Array<{
        title: string;
        source: string;
        status: string;
      }>
    ).filter((t) => t.source === 'TREE_CARE' && t.status === 'PENDING');
  const citrus = (variety: string | null) =>
    seedPlant(prisma, alice.id, {
      name: 'Nimbu',
      species: 'Citrus',
      species_family: 'citrus',
      variety,
      lifecycle_stage: 'MATURE_BEARING',
    });
  const setVariety = (id: string, variety: string | null) =>
    prisma.plant.update({ where: { id }, data: { variety } });

  it('a Kagzi tree gets lime reminders', async () => {
    const plant = await citrus('Kagzi');
    expect((await materialize(plant.id)).status).toBe(201);
    expect((await pendingCare(plant.id)).map((t) => t.title)).toEqual([
      'Feed the lime',
    ]);
  });

  it('changing the variety to Kinnow swaps lime reminders for mandarin ones, no duplicates', async () => {
    const plant = await citrus('Kagzi');
    await materialize(plant.id);
    await setVariety(plant.id, 'Kinnow');
    await materialize(plant.id);
    await materialize(plant.id);
    expect((await pendingCare(plant.id)).map((t) => t.title)).toEqual([
      'Feed the mandarin',
    ]);
  });

  it('clearing the variety cancels them, with no season-pack filler in their place', async () => {
    const plant = await citrus('Kagzi');
    await materialize(plant.id);
    await setVariety(plant.id, null);
    await materialize(plant.id);
    expect(await pendingCare(plant.id)).toEqual([]);
    const all = (await as().get(`/api/v1/ledger/plants/${plant.id}/tasks`)).body
      .data as Array<{ source: string }>;
    expect(all.some((t) => t.source === 'SEASONAL_PACK')).toBe(false);
  });
});
