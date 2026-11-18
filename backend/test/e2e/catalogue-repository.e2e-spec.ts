import { INestApplication } from '@nestjs/common';
import { CATALOGUE_SEED } from '../../src/modules/catalogue';
import { CatalogueRepository } from '../../src/modules/catalogue/catalogue.repository';
import type { CatalogueSeed } from '../../src/modules/catalogue';
import { hindiSeed } from '../../src/modules/catalogue/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';

/** A small catalogue: two crops, the method and care step they use. */
const tomato = CATALOGUE_SEED.crops.find((c) => c.id === 'tomato')!;
const carrot = CATALOGUE_SEED.crops.find((c) => c.id === 'carrot')!;
const small: CatalogueSeed = {
  crops: [tomato, { ...carrot, method: 'NURSERY_TRANSPLANT', care: [] }],
  methods: CATALOGUE_SEED.methods.filter((m) => m.key === 'NURSERY_TRANSPLANT'),
  careSteps: CATALOGUE_SEED.careSteps.filter((s) => s.key === 'stake'),
  fruitTypes: [],
  fruitPlants: [],
  perennialFlowers: [],
  treeCare: [],
};
const inOrder = <T>(items: T[]) =>
  items.map((item, sort_order) => ({ ...item, sort_order }));
const ordered = (seed: CatalogueSeed) => inOrder(seed.crops);
/** Everything a push of this seed writes. */
const writeOf = (seed: CatalogueSeed) => ({
  crops: ordered(seed),
  methods: seed.methods,
  careSteps: seed.careSteps,
  fruitTypes: inOrder(seed.fruitTypes),
  fruitPlants: inOrder(seed.fruitPlants),
  perennialFlowers: inOrder(seed.perennialFlowers),
});
const none = { fruitTypes: [], fruitPlants: [], perennialFlowers: [] };

describe('catalogue repository', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let repo: CatalogueRepository;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    repo = app.get(CatalogueRepository);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE catalogue_crops, catalogue_methods, catalogue_care_steps, catalogue_fruit_types, catalogue_fruit_plants, catalogue_perennial_flowers',
    );
    await prisma.catalogueMeta.update({
      where: { id: 1 },
      data: { version: 0 },
    });
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE catalogue_crops, catalogue_methods, catalogue_care_steps, catalogue_fruit_types, catalogue_fruit_plants, catalogue_perennial_flowers',
    );
    await repo.applyPush(writeOf(CATALOGUE_SEED));
    await app.close();
  });

  it('starts at version 0 and stores a push in one version', async () => {
    expect(await repo.version()).toBe(0);
    const version = await repo.applyPush(writeOf(small));
    expect(version).toBe(1);
    expect(await repo.loadSeed(['APPROVED', 'RETIRED'])).toEqual(small);
  });

  it('round-trips Hindi texts', async () => {
    const hi = hindiSeed();
    const withHindi: CatalogueSeed = {
      ...small,
      crops: [hi.crops.find((c) => c.id === 'tomato')!, small.crops[1]],
      methods: hi.methods.filter((m) => m.key === 'NURSERY_TRANSPLANT'),
    };
    await repo.applyPush(writeOf(withHindi));
    expect(await repo.loadSeed(['APPROVED', 'RETIRED'])).toEqual(withHindi);
  });

  it('a later push changes only what it carries and bumps the version', async () => {
    await repo.applyPush(writeOf(small));
    const changed = { ...tomato, harvest_span_days: 99 };
    expect(
      await repo.applyPush({
        crops: [{ ...changed, sort_order: 0 }],
        methods: [],
        careSteps: [],
        ...none,
      }),
    ).toBe(2);
    const loaded = await repo.loadSeed(['APPROVED']);
    expect(loaded.crops.map((c) => c.harvest_span_days)).toEqual([
      99,
      carrot.harvest_span_days,
    ]);
  });

  it('loads only the statuses asked for, crops in catalogue order', async () => {
    await repo.applyPush({
      crops: [
        {
          ...carrot,
          method: 'NURSERY_TRANSPLANT',
          care: [],
          status: 'RETIRED',
          sort_order: 0,
        },
        { ...tomato, sort_order: 1 },
      ],
      methods: small.methods,
      careSteps: small.careSteps,
      ...none,
    });
    expect((await repo.loadSeed(['APPROVED'])).crops.map((c) => c.id)).toEqual([
      'tomato',
    ]);
    expect(
      (await repo.loadSeed(['APPROVED', 'RETIRED'])).crops.map((c) => c.id),
    ).toEqual(['carrot', 'tomato']);
  });

  it('round-trips fruit types, fruit entries and flowers in seed order, without drafts', async () => {
    const rose = CATALOGUE_SEED.perennialFlowers.find(
      (f) => f.family === 'rose',
    )!;
    const jasmine = CATALOGUE_SEED.perennialFlowers.find(
      (f) => f.family === 'jasmine',
    )!;
    const mango = CATALOGUE_SEED.fruitTypes.find((t) => t.key === 'mango')!;
    const plants = CATALOGUE_SEED.fruitPlants.filter(
      (p) => p.species_family === 'mango',
    );
    await repo.applyPush({
      ...writeOf(small),
      fruitTypes: inOrder([mango]),
      fruitPlants: inOrder(plants),
      perennialFlowers: inOrder([
        { ...jasmine, status: 'DRAFT' as const },
        rose,
      ]),
    });
    const loaded = await repo.loadSeed(['APPROVED', 'RETIRED']);
    expect(loaded.fruitTypes).toEqual([mango]);
    expect(loaded.fruitPlants).toEqual(plants);
    expect(loaded.perennialFlowers).toEqual([rose]);
  });
});
