import type { CatalogueSeed } from '../domain/types';
import { CARE_STEP_SEED } from './care-steps.seed';
import { CROP_SEED } from './crops.seed';
import { FRUIT_PLANT_SEED } from './fruit-plants.seed';
import { FRUIT_TYPE_SEED } from './fruit-types.seed';
import { METHOD_SEED } from './methods.seed';
import { PERENNIAL_FLOWER_SEED } from './perennial-flowers.seed';

/** Everything the catalogue push writes. */
export const CATALOGUE_SEED: CatalogueSeed = {
  crops: CROP_SEED,
  methods: METHOD_SEED,
  careSteps: CARE_STEP_SEED,
  fruitTypes: FRUIT_TYPE_SEED,
  fruitPlants: FRUIT_PLANT_SEED,
  perennialFlowers: PERENNIAL_FLOWER_SEED,
  treeCare: [],
};
