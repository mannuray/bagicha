import { ADVICE_SEED } from './advice.seed';
import type { CatalogueSeed } from '../domain/types';
import { CARE_STEP_SEED } from './care-steps.seed';
import { CROP_SEED } from './crops.seed';
import { FRUIT_PLANT_SEED } from './fruit-plants.seed';
import { FRUIT_TYPE_SEED } from './fruit-types.seed';
import { METHOD_SEED } from './methods.seed';
import { PERENNIAL_FLOWER_SEED } from './perennial-flowers.seed';
import { SEASON_GUIDE_SEED } from './season-guide.seed';
import { TREE_CARE_SEED } from './tree-care';

/** Everything the catalogue push writes. */
export const CATALOGUE_SEED: CatalogueSeed = {
  crops: CROP_SEED,
  methods: METHOD_SEED,
  careSteps: CARE_STEP_SEED,
  fruitTypes: FRUIT_TYPE_SEED,
  fruitPlants: FRUIT_PLANT_SEED,
  perennialFlowers: PERENNIAL_FLOWER_SEED,
  treeCare: TREE_CARE_SEED,
  seasonGuide: SEASON_GUIDE_SEED,
  advice: ADVICE_SEED,
};
