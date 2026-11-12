import { MANGO_CARE } from './mango';
import type { FamilyCare } from './types';

export type {
  Anchor,
  CareCategory,
  CareItem,
  CareStage,
  FamilyCare,
  PhaseWindow,
  RegionCare,
} from './types';
export {
  careApplies,
  NEAREST_REGIONS,
  resolveRegionCare,
  stageOf,
} from './region-care';
export { carePhaseView, NOT_GROWN_NOTE, treeCareDue } from './engine';
export type {
  CareLine,
  CarePhase,
  CareReminder,
  TreeCareInput,
} from './engine';

/** Tree families whose care follows the add-plant playbook. */
export const TREE_CARE: Readonly<Record<string, FamilyCare>> = {
  mango: MANGO_CARE,
};

/**
 * Catalogue families still on generic season packs. This list only shrinks:
 * when a family's care ships, it moves from here into TREE_CARE.
 */
export const CARE_PENDING: readonly string[] = [
  'citrus',
  'guava',
  'litchi',
  'pomegranate',
  'banana',
  'papaya',
  'grape',
  'jackfruit',
  'coconut',
  'sapota',
  'amla',
  'custard_apple',
  'moringa',
  'jamun',
  'ber',
  'bael',
  'fig',
  'mulberry',
  'star_fruit',
  'karonda',
  'phalsa',
  'wood_apple',
  'tamarind',
  'kokum',
  'dragon_fruit',
];

export function careFor(family: string): FamilyCare | null {
  return TREE_CARE[family] ?? null;
}
