import { INestApplication } from '@nestjs/common';
import { CATALOGUE_SEED } from '../../src/modules/catalogue';
import { CatalogueRepository } from '../../src/modules/catalogue/catalogue.repository';
import type { CatalogueSeed } from '../../src/modules/catalogue';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';

/** A small catalogue: two crops, the method and care step they use. */
const tomato = CATALOGUE_SEED.crops.find((c) => c.id === 'tomato')!;
const carrot = CATALOGUE_SEED.crops.find((c) => c.id === 'carrot')!;
const small: CatalogueSeed = {
  crops: [tomato, { ...carrot, method: 'NURSERY_TRANSPLANT', care: [] }],
  methods: CATALOGUE_SEED.methods.filter((m) => m.key === 'NURSERY_TRANSPLANT'),
  careSteps: CATALOGUE_SEED.careSteps.filter((s) => s.key === 'stake'),
};
const ordered = (seed: CatalogueSeed) =>
  seed.crops.map((c, sort_order) => ({ ...c, sort_order }));

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
      'TRUNCATE catalogue_crops, catalogue_methods, catalogue_care_steps',
    );
    await prisma.catalogueMeta.update({
      where: { id: 1 },
      data: { version: 0 },
    });
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE catalogue_crops, catalogue_methods, catalogue_care_steps',
    );
    await repo.applyPush({
      crops: ordered(CATALOGUE_SEED),
      methods: CATALOGUE_SEED.methods,
      careSteps: CATALOGUE_SEED.careSteps,
    });
    await app.close();
  });

  it('starts at version 0 and stores a push in one version', async () => {
    expect(await repo.version()).toBe(0);
    const version = await repo.applyPush({
      crops: ordered(small),
      methods: small.methods,
      careSteps: small.careSteps,
    });
    expect(version).toBe(1);
    expect(await repo.loadSeed(['APPROVED', 'RETIRED'])).toEqual(small);
  });

  it('a later push changes only what it carries and bumps the version', async () => {
    await repo.applyPush({
      crops: ordered(small),
      methods: small.methods,
      careSteps: small.careSteps,
    });
    const changed = { ...tomato, harvest_span_days: 99 };
    expect(
      await repo.applyPush({
        crops: [{ ...changed, sort_order: 0 }],
        methods: [],
        careSteps: [],
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
    });
    expect((await repo.loadSeed(['APPROVED'])).crops.map((c) => c.id)).toEqual([
      'tomato',
    ]);
    expect(
      (await repo.loadSeed(['APPROVED', 'RETIRED'])).crops.map((c) => c.id),
    ).toEqual(['carrot', 'tomato']);
  });
});
