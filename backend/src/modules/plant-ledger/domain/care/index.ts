/** The tree-care engine. Care data lives in the catalogue (seed/tree-care). */

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
