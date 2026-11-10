import type { RegionCluster } from '../auth';

/** The seven agro-climatic regions the backend plans seasons for, with places people recognise. */
export const REGIONS: ReadonlyArray<{ id: RegionCluster; labelKey: string; examplesKey: string }> = [
  { id: 'NORTH_INDIA', labelKey: 'regions.NORTH_INDIA.label', examplesKey: 'regions.NORTH_INDIA.examples' },
  { id: 'EAST_INDIA', labelKey: 'regions.EAST_INDIA.label', examplesKey: 'regions.EAST_INDIA.examples' },
  { id: 'WEST_INDIA', labelKey: 'regions.WEST_INDIA.label', examplesKey: 'regions.WEST_INDIA.examples' },
  { id: 'CENTRAL_INDIA', labelKey: 'regions.CENTRAL_INDIA.label', examplesKey: 'regions.CENTRAL_INDIA.examples' },
  { id: 'SOUTH_DECCAN', labelKey: 'regions.SOUTH_DECCAN.label', examplesKey: 'regions.SOUTH_DECCAN.examples' },
  { id: 'COASTAL_HUMID', labelKey: 'regions.COASTAL_HUMID.label', examplesKey: 'regions.COASTAL_HUMID.examples' },
  { id: 'HILLS_COOL', labelKey: 'regions.HILLS_COOL.label', examplesKey: 'regions.HILLS_COOL.examples' },
];
