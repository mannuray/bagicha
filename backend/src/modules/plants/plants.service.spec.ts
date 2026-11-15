import { hindiSeed, seededCatalogueStore } from '../catalogue/testing';
import { PlantsService } from './plants.service';

const page = { page: 1, page_size: 10 };

describe('PlantsService over the catalogue', () => {
  const service = new PlantsService(seededCatalogueStore());

  it('ranks the catalogue search entries and gives each its key as id', async () => {
    const result = await service.search('dasheri', page);
    expect(result.items[0]).toEqual({
      id: 'mango:Dasheri',
      display_name: 'Mango (Dasheri)',
      species_family: 'mango',
      species: 'mango',
      variety: 'Dasheri',
      plant_type: 'fruit_tree',
    });
  });

  it('names results in Hindi when asked, keeping ids and order', async () => {
    const hindi = new PlantsService(seededCatalogueStore(hindiSeed()));
    const hi = await hindi.search('dasheri', page, 'hi');
    expect(hi.items[0]).toMatchObject({
      id: 'mango:Dasheri',
      display_name: 'आम (दशहरी)',
    });
    const en = await hindi.search('dasheri', page);
    expect(en.items.map((i) => i.id)).toEqual(hi.items.map((i) => i.id));
    expect(en.items[0].display_name).toBe('Mango (Dasheri)');
    const rose = await hindi.resolve('gulab', undefined, undefined, 'hi');
    expect(rose.match?.display_name).toBe('गुलाब');
  });

  it('finds a Hindi name typed in either Unicode form', async () => {
    for (const q of ['आ\u095Cू', 'आ\u0921\u093Cू']) {
      const result = await service.search(q, page);
      expect(result.items[0]?.display_name).toBe('Peach');
    }
  });

  it('finds perennial flowers by their Hindi names', async () => {
    const result = await service.resolve('गुलाब');
    expect(result.match).toMatchObject({
      id: 'rose',
      plant_type: 'perennial_flower',
    });
  });
});
