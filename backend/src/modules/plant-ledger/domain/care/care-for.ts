import type { RegionCluster } from '@prisma/client';
import type { Catalogue, FamilyCare, TreeWords } from '../../../catalogue';
import { careApplies } from './region-care';

/**
 * The reviewed care a tree gets, or null: none for its family or kind, or its
 * region not yet checked. Every reader (plant page, reminders, first-watering
 * job, AI context) decides "care or care coming" here.
 */
export function careFor(
  catalogue: Catalogue,
  family: string,
  tree: TreeWords,
  region: RegionCluster,
): FamilyCare | null {
  const care = catalogue.treeCareFor(family, tree);
  return care && careApplies(care, region) ? care : null;
}
