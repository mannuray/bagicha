import { PrismaService } from '../../prisma/prisma.service';
import { CatalogRepository } from './catalog.repository';

const entry = {
  species_family: 'mango',
  species: 'Mango',
  variety: null,
  display_name: 'Mango',
  plant_type: 'fruit_tree',
  aliases: ['aam'],
  languages: { hi: ['आम'] },
  regions: [],
  confidence_weight: 0.9,
};

function build(stored: object[]) {
  const table = {
    findMany: jest.fn(() => Promise.resolve(stored)),
    findFirst: jest.fn(),
    update: jest.fn(() => Promise.resolve({})),
    create: jest.fn(() => Promise.resolve({})),
  };
  const repo = new CatalogRepository({
    plantCatalogEntry: table,
  } as unknown as PrismaService);
  return { repo, table };
}

describe('CatalogRepository.upsertAll (runs on every boot)', () => {
  it('reads the catalogue once and writes nothing when it is unchanged', async () => {
    const { repo, table } = build([
      { id: 'c1', active: true, created_at: new Date(), ...entry },
    ]);
    await repo.upsertAll([entry]);
    expect(table.findMany).toHaveBeenCalledTimes(1);
    expect(table.findFirst).not.toHaveBeenCalled();
    expect(table.update).not.toHaveBeenCalled();
    expect(table.create).not.toHaveBeenCalled();
  });

  it('treats JSON with keys in another order as unchanged', async () => {
    const seed = { ...entry, languages: { hi: ['आम'], mr: ['आंबा'] } };
    const { repo, table } = build([
      { id: 'c1', ...seed, languages: { mr: ['आंबा'], hi: ['आम'] } },
    ]);
    await repo.upsertAll([seed]);
    expect(table.update).not.toHaveBeenCalled();
  });

  it('updates only a changed entry and creates only a new one', async () => {
    const { repo, table } = build([{ id: 'c1', ...entry, aliases: ['old'] }]);
    const lemon = { ...entry, species_family: 'citrus', species: 'Lemon' };
    await repo.upsertAll([entry, lemon]);
    expect(table.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: entry,
    });
    expect(table.create).toHaveBeenCalledWith({ data: lemon });
  });
});
