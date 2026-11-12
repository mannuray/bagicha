import { Clock } from '../../common/time';
import { CatalogRepository } from './catalog.repository';
import { PlantsService } from './plants.service';

const mango = {
  id: 'c1',
  species_family: 'mango',
  species: 'Mango',
  variety: null,
  display_name: 'Mango',
  plant_type: 'fruit_tree',
  aliases: ['aam'],
  languages: null,
  regions: [],
  confidence_weight: 0.9,
  active: true,
};

function build() {
  const catalog = {
    listActive: jest.fn(() => Promise.resolve([mango])),
    upsertAll: jest.fn(() => Promise.resolve()),
  };
  let now = new Date('2026-11-12T00:00:00Z');
  const clock = {
    now: () => now,
    set: (d: Date) => (now = d),
  };
  const service = new PlantsService(
    catalog as unknown as CatalogRepository,
    clock as unknown as Clock,
  );
  return { service, catalog, clock };
}

describe('PlantsService catalogue cache', () => {
  const page = { page: 1, page_size: 10 };

  it('reads the catalogue once for many searches (each keystroke is a search)', async () => {
    const { service, catalog } = build();
    await service.search('aa', page);
    await service.search('aam', page);
    await service.resolve('aam');
    expect(catalog.listActive).toHaveBeenCalledTimes(1);
  });

  it('reads it again after ten minutes', async () => {
    const { service, catalog, clock } = build();
    await service.search('aam', page);
    clock.set(new Date('2026-11-12T00:10:01Z'));
    await service.search('aam', page);
    expect(catalog.listActive).toHaveBeenCalledTimes(2);
  });
});
