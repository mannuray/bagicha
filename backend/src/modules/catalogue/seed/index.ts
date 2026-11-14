import type { CatalogueSeed } from '../domain/types';
import { CARE_STEP_SEED } from './care-steps.seed';
import { CROP_SEED } from './crops.seed';
import { METHOD_SEED } from './methods.seed';

/** Everything the catalogue push writes. */
export const CATALOGUE_SEED: CatalogueSeed = {
  crops: CROP_SEED,
  methods: METHOD_SEED,
  careSteps: CARE_STEP_SEED,
};
