import type { PrismaService } from '../../prisma/prisma.service';
import { CatalogueRepository } from './catalogue.repository';

describe('CatalogueRepository.applyPush', () => {
  it('gives the push transaction room for a slow link to the database', async () => {
    const options: unknown[] = [];
    const tx = {
      catalogueMeta: { upsert: jest.fn(() => Promise.resolve({ version: 1 })) },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown, opts: unknown) => {
        options.push(opts);
        return fn(tx);
      }),
    };
    const repo = new CatalogueRepository(prisma as unknown as PrismaService);
    await repo.applyPush({
      crops: [],
      methods: [],
      careSteps: [],
      fruitTypes: [],
      fruitPlants: [],
      perennialFlowers: [],
    });
    // Prisma's default is 5 s: ~65 upserts from a laptop to Neon can take longer.
    expect(options[0]).toEqual({ timeout: 60_000, maxWait: 10_000 });
  });

  it('adds new records in one batch per kind and updates only the ones that exist', async () => {
    const table = (existing: string[], keyField: string) => ({
      findMany: jest.fn(() =>
        Promise.resolve(existing.map((k) => ({ [keyField]: k }))),
      ),
      createMany: jest.fn(() => Promise.resolve({ count: 0 })),
      update: jest.fn(() => Promise.resolve({})),
      upsert: jest.fn(() => Promise.resolve({})),
    });
    const tx = {
      catalogueCrop: table(['tomato'], 'id'),
      catalogueMethod: table([], 'key'),
      catalogueCareStep: table([], 'key'),
      catalogueFruitType: table([], 'key'),
      catalogueFruitPlant: table(['mango'], 'key'),
      cataloguePerennialFlower: table([], 'family'),
      catalogueMeta: { upsert: jest.fn(() => Promise.resolve({ version: 2 })) },
    };
    const prisma = {
      $transaction: jest.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    const repo = new CatalogueRepository(prisma as unknown as PrismaService);
    const plant = (key: string, sort_order: number) =>
      ({
        key,
        species_family: 'mango',
        status: 'APPROVED',
        notes: null,
        sort_order,
      }) as never;
    const crop = (id: string, sort_order: number) =>
      ({
        id,
        kind: 'CROP',
        name: id,
        family: 'X',
        method: 'M',
        status: 'APPROVED',
        notes: null,
        sort_order,
      }) as never;
    await repo.applyPush({
      crops: [crop('tomato', 0), crop('carrot', 1)],
      methods: [],
      careSteps: [],
      fruitTypes: [],
      fruitPlants: [
        plant('mango', 0),
        plant('mango:A', 1),
        plant('mango:B', 2),
      ],
      perennialFlowers: [],
    });
    const plants = tx.catalogueFruitPlant;
    expect(plants.createMany).toHaveBeenCalledTimes(1);
    expect(
      (
        plants.createMany.mock.calls[0] as unknown as [
          { data: Array<{ key: string }> },
        ]
      )[0].data.map((r) => r.key),
    ).toEqual(['mango:A', 'mango:B']);
    expect(plants.update).toHaveBeenCalledTimes(1);
    expect(plants.upsert).not.toHaveBeenCalled();
    expect(tx.catalogueCrop.createMany).toHaveBeenCalledTimes(1);
    expect(tx.catalogueCrop.update).toHaveBeenCalledTimes(1);
    expect(tx.catalogueFruitType.createMany).not.toHaveBeenCalled();
  });
});
