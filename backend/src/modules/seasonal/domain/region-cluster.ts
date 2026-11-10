import { RegionCluster } from '@prisma/client';

const CLUSTERS: Array<[RegionCluster, string[]]> = [
  [RegionCluster.EAST_INDIA, ['malda', 'kolkata', 'patna']],
  [RegionCluster.NORTH_INDIA, ['delhi', 'lucknow', 'chandigarh']],
  [RegionCluster.WEST_INDIA, ['mumbai', 'pune', 'surat']],
  [RegionCluster.CENTRAL_INDIA, ['bhopal', 'indore', 'raipur']],
  [RegionCluster.SOUTH_DECCAN, ['chennai', 'hyderabad', 'bengaluru']],
  [RegionCluster.COASTAL_HUMID, ['coast', 'goa', 'kochi']],
  [RegionCluster.HILLS_COOL, ['shimla', 'dehradun', 'gangtok']],
];

/** Agro-climatic cluster for a district name; North India when unknown. */
export function resolveRegionCluster(
  district: string | null | undefined,
): RegionCluster {
  const name = (district || '').toLowerCase();
  const match = CLUSTERS.find(([, places]) =>
    places.some((p) => name.includes(p)),
  );
  return match ? match[0] : RegionCluster.NORTH_INDIA;
}
