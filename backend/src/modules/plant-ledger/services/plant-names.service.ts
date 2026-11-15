import { Injectable } from '@nestjs/common';
import type { Lang } from '../../../common/http/lang';
import { CatalogueStore } from '../../catalogue';

/** What naming a plant needs from it. */
export interface NamedPlant {
  name: string;
  crop_id?: string | null;
  species_family?: string | null;
}

export type PlantNamer = (plant: NamedPlant) => string;

/** The saved name: what English requests (and code that never shows names) use. */
export const savedName: PlantNamer = (plant) => plant.name;

/**
 * How plants are named in a response: the saved name, or in Hindi the
 * catalogue's Hindi name while the plant keeps its catalogue name.
 */
@Injectable()
export class PlantNamesService {
  constructor(private readonly catalogue: CatalogueStore) {}

  /** One namer per request, over one catalogue snapshot. */
  async namer(lang: Lang): Promise<PlantNamer> {
    if (lang !== 'hi') return savedName;
    const catalogue = await this.catalogue.snapshot();
    return (plant) =>
      catalogue.hindiPlantName({
        name: plant.name,
        crop_id: plant.crop_id ?? null,
        species_family: plant.species_family ?? null,
      }) ?? plant.name;
  }
}
