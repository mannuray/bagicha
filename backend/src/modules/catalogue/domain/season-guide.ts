import type { RegionCluster } from '@prisma/client';
import type { CatalogueStatus } from './types';

/** One month of the home season tips for a region. */
export interface SeasonMonth {
  season: string;
  headline: string;
  points: string[];
}

/** A region's twelve months of home season tips, January first. */
export interface SeasonGuideSeed {
  region: RegionCluster;
  months: SeasonMonth[];
  status: CatalogueStatus;
  notes: string | null;
}
