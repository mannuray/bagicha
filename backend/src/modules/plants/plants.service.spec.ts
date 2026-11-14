import { seededCatalogueStore } from '../catalogue/testing';
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

  it('finds perennial flowers by their Hindi names', async () => {
    const result = await service.resolve('गुलाब');
    expect(result.match).toMatchObject({
      id: 'rose',
      plant_type: 'perennial_flower',
    });
  });
});
