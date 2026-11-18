import { INestApplication } from '@nestjs/common';
import { CATALOGUE_SEED } from '../../src/modules/catalogue';
import type { CatalogueSeed } from '../../src/modules/catalogue';
import { CatalogueRepository } from '../../src/modules/catalogue/catalogue.repository';
import { CataloguePushService } from '../../src/modules/catalogue/push/catalogue-push.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { treeCareFixture } from '../../src/modules/catalogue/testing';
import { createTestApp } from './app';

const reasonOf = (p: Promise<unknown>) =>
  p.then(
    () => 'ok',
    (e: { reason?: string }) => e.reason,
  );
const outcomes = (items: Array<{ outcome: string }>) =>
  [...new Set(items.map((i) => i.outcome))].sort();
const editCrop = (
  id: string,
  change: (c: CatalogueSeed['crops'][number]) => object,
): CatalogueSeed => ({
  ...CATALOGUE_SEED,
  crops: CATALOGUE_SEED.crops.map((c) =>
    c.id === id ? { ...c, ...change(c) } : c,
  ),
});

describe('catalogue push', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let repo: CatalogueRepository;
  let push: CataloguePushService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    repo = app.get(CatalogueRepository);
    push = new CataloguePushService(repo);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE catalogue_crops, catalogue_methods, catalogue_care_steps, catalogue_fruit_types, catalogue_fruit_plants, catalogue_perennial_flowers, catalogue_tree_care',
    );
    await prisma.catalogueMeta.update({
      where: { id: 1 },
      data: { version: 0 },
    });
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE catalogue_crops, catalogue_methods, catalogue_care_steps, catalogue_fruit_types, catalogue_fruit_plants, catalogue_perennial_flowers, catalogue_tree_care',
    );
    await push.push(CATALOGUE_SEED);
    await app.close();
  });

  it('adds everything on the first push, then finds nothing to do', async () => {
    const first = await push.push(CATALOGUE_SEED);
    expect(first.version).toBe(1);
    const all = (r: typeof first) => [
      ...r.crops,
      ...r.methods,
      ...r.careSteps,
      ...r.fruitTypes,
      ...r.fruitPlants,
      ...r.perennialFlowers,
      ...r.treeCare,
    ];
    expect(outcomes(all(first))).toEqual(['added']);
    expect(first.crops).toHaveLength(CATALOGUE_SEED.crops.length);
    expect(first.fruitTypes).toHaveLength(CATALOGUE_SEED.fruitTypes.length);
    expect(first.fruitPlants).toHaveLength(CATALOGUE_SEED.fruitPlants.length);
    expect(first.perennialFlowers).toHaveLength(
      CATALOGUE_SEED.perennialFlowers.length,
    );
    const again = await push.push(CATALOGUE_SEED);
    expect(again.version).toBe(1);
    expect(outcomes(all(again))).toEqual(['unchanged']);
    expect(await repo.version()).toBe(1);
  });

  it('reports a changed crop alone and bumps the version', async () => {
    await push.push(CATALOGUE_SEED);
    const report = await push.push(
      editCrop('tomato', (c) => ({
        harvest_span_days: c.harvest_span_days + 1,
      })),
    );
    expect(report.version).toBe(2);
    expect(report.crops.filter((c) => c.outcome !== 'unchanged')).toEqual([
      { key: 'tomato', outcome: 'changed' },
    ]);
  });

  it('stops with nothing changed when the seed lacks a stored crop', async () => {
    await push.push(CATALOGUE_SEED);
    const lacking = {
      ...CATALOGUE_SEED,
      crops: CATALOGUE_SEED.crops.filter((c) => c.id !== 'carrot'),
    };
    expect(await reasonOf(push.push(lacking))).toBe(
      'CATALOGUE_MISSING_FROM_SEED',
    );
    expect(await repo.version()).toBe(1);
  });

  it('rejects a crop whose method is not in the seed, before writing', async () => {
    expect(
      await reasonOf(
        push.push(editCrop('carrot', () => ({ method: 'NO_SUCH_METHOD' }))),
      ),
    ).toBe('CATALOGUE_INVALID');
    expect(await repo.version()).toBe(0);
  });

  it('rejects an approved crop using a draft method, which the API could not load', async () => {
    const seed = {
      ...CATALOGUE_SEED,
      methods: CATALOGUE_SEED.methods.map((m) =>
        m.key === 'CLOVE' ? { ...m, status: 'DRAFT' } : m,
      ),
    };
    expect(await reasonOf(push.push(seed))).toBe('CATALOGUE_INVALID');
    expect(await repo.version()).toBe(0);
  });

  it('stores the status the seed gives', async () => {
    await push.push(editCrop('carrot', () => ({ status: 'RETIRED' })));
    const stored = await repo.loadSeed(['RETIRED']);
    expect(stored.crops.map((c) => c.id)).toEqual(['carrot']);
  });

  it('adds, then leaves unchanged, a tree-care record', async () => {
    const seed = { ...CATALOGUE_SEED, treeCare: [treeCareFixture()] };
    const first = await push.push(seed);
    expect(first.treeCare).toEqual([{ key: 'mango', outcome: 'added' }]);
    const again = await push.push(seed);
    expect(again.treeCare).toEqual([{ key: 'mango', outcome: 'unchanged' }]);
  });

  it('refuses a seed missing a stored tree-care record', async () => {
    await push.push({ ...CATALOGUE_SEED, treeCare: [treeCareFixture()] });
    const refusal = await push.push({ ...CATALOGUE_SEED, treeCare: [] }).then(
      () => null,
      (e: { reason?: string; details?: { treeCare?: string[] } }) => e,
    );
    expect(refusal?.reason).toBe('CATALOGUE_MISSING_FROM_SEED');
    expect(refusal?.details?.treeCare).toEqual(['mango']);
  });

  it('stops with every table unchanged when the seed lacks a stored fruit entry', async () => {
    await push.push(CATALOGUE_SEED);
    const lacking = {
      ...CATALOGUE_SEED,
      crops: CATALOGUE_SEED.crops.map((c) =>
        c.id === 'tomato' ? { ...c, harvest_span_days: 1 } : c,
      ),
      fruitPlants: CATALOGUE_SEED.fruitPlants.filter(
        (p) => p.key !== 'mango:malda',
      ),
    };
    expect(await reasonOf(push.push(lacking))).toBe(
      'CATALOGUE_MISSING_FROM_SEED',
    );
    expect(await repo.version()).toBe(1);
    const stored = await repo.loadSeed(['APPROVED']);
    expect(
      stored.crops.find((c) => c.id === 'tomato')?.harvest_span_days,
    ).not.toBe(1);
    expect(stored.fruitPlants.map((p) => p.key)).toContain('mango:malda');
  });

  it("reports one flower's changed care alone", async () => {
    await push.push(CATALOGUE_SEED);
    const report = await push.push({
      ...CATALOGUE_SEED,
      perennialFlowers: CATALOGUE_SEED.perennialFlowers.map((f) =>
        f.family === 'rose'
          ? { ...f, care: { ...f.care, PLAINS: f.care.PLAINS.slice(1) } }
          : f,
      ),
    });
    expect(report.version).toBe(2);
    expect(
      report.perennialFlowers.filter((f) => f.outcome !== 'unchanged'),
    ).toEqual([{ key: 'rose', outcome: 'changed' }]);
    expect(
      [...report.fruitTypes, ...report.fruitPlants].every(
        (i) => i.outcome === 'unchanged',
      ),
    ).toBe(true);
  });
});
