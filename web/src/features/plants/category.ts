import type { Plant } from './schemas';

export type PlantCategory = 'tree' | 'crop' | 'seasonalFlower' | 'perennialFlower';

/**
 * The one rule for what kind of plant this is. Journey plants (from the crop calendar)
 * are crops or seasonal flowers; the rest are trees or perennial flowers.
 */
export function plantCategory(plant: Pick<Plant, 'record_kind' | 'crop_id'>): PlantCategory {
  const flower = plant.record_kind === 'FLOWER';
  if (plant.crop_id) return flower ? 'seasonalFlower' : 'crop';
  return flower ? 'perennialFlower' : 'tree';
}

export type GardenCounts = Record<PlantCategory, number> & { flowers: number };

/** How many of each kind the garden holds (Home's garden summary). */
export function gardenCounts(plants: Array<Pick<Plant, 'record_kind' | 'crop_id'>>): GardenCounts {
  const counts: GardenCounts = { tree: 0, crop: 0, seasonalFlower: 0, perennialFlower: 0, flowers: 0 };
  for (const plant of plants) counts[plantCategory(plant)] += 1;
  counts.flowers = counts.seasonalFlower + counts.perennialFlower;
  return counts;
}

/** Trees and perennial flowers follow the tree season pack; journey plants follow the crop calendar. */
export function usesSeasonPack(plant: Pick<Plant, 'record_kind' | 'crop_id'>): boolean {
  const category = plantCategory(plant);
  return category === 'tree' || category === 'perennialFlower';
}

/** Catalogue suggestions for the form: perennial flowers for the Flower kind, everything else for Tree. */
export function suggestionsFor<T extends { plant_type: string }>(items: T[], flowers: boolean): T[] {
  return items.filter((item) => (item.plant_type === 'perennial_flower') === flowers);
}
