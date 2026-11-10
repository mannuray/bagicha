import type { RegionCluster } from '../auth';

export interface Region {
  id: RegionCluster;
  labelKey: string;
  examplesKey: string;
  /** Places whose region we know. Mirrors the backend's region-cluster.ts (a test keeps them equal). */
  places: readonly string[];
}

/** The seven agro-climatic regions the backend plans seasons for. */
export const REGIONS: readonly Region[] = [
  { id: 'EAST_INDIA', labelKey: 'regions.EAST_INDIA.label', examplesKey: 'regions.EAST_INDIA.examples', places: ['malda', 'kolkata', 'patna'] },
  { id: 'NORTH_INDIA', labelKey: 'regions.NORTH_INDIA.label', examplesKey: 'regions.NORTH_INDIA.examples', places: ['delhi', 'lucknow', 'chandigarh'] },
  { id: 'WEST_INDIA', labelKey: 'regions.WEST_INDIA.label', examplesKey: 'regions.WEST_INDIA.examples', places: ['mumbai', 'pune', 'surat'] },
  { id: 'CENTRAL_INDIA', labelKey: 'regions.CENTRAL_INDIA.label', examplesKey: 'regions.CENTRAL_INDIA.examples', places: ['bhopal', 'indore', 'raipur'] },
  { id: 'SOUTH_DECCAN', labelKey: 'regions.SOUTH_DECCAN.label', examplesKey: 'regions.SOUTH_DECCAN.examples', places: ['chennai', 'hyderabad', 'bengaluru'] },
  { id: 'COASTAL_HUMID', labelKey: 'regions.COASTAL_HUMID.label', examplesKey: 'regions.COASTAL_HUMID.examples', places: ['coast', 'goa', 'kochi'] },
  { id: 'HILLS_COOL', labelKey: 'regions.HILLS_COOL.label', examplesKey: 'regions.HILLS_COOL.examples', places: ['shimla', 'dehradun', 'gangtok'] },
];

/**
 * The region of a district we know, matched the way the backend matches it
 * (case-insensitive, the place name anywhere in the text). Null when unknown,
 * so the user picks the closest region themselves.
 */
export function knownRegion(district: string): RegionCluster | null {
  const name = district.trim().toLowerCase();
  if (!name) return null;
  return REGIONS.find((r) => r.places.some((place) => name.includes(place)))?.id ?? null;
}

export const regionById = (id: RegionCluster | null | undefined) => REGIONS.find((r) => r.id === id);
