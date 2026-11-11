import { regionForDistrict } from '../../regions';
import { RegionCluster, User } from '@prisma/client';

/**
 * Agro-climatic cluster for a district name, from the full district list
 * (district-map spec); North India when the text names no district we know.
 */
export function resolveRegionCluster(
  district: string | null | undefined,
): RegionCluster {
  return regionForDistrict(district ?? '') ?? RegionCluster.NORTH_INDIA;
}

/** The user's chosen region, or a best guess from their district for older profiles. */
export function regionFor(
  user: Pick<User, 'region_cluster' | 'district'>,
): RegionCluster {
  return user.region_cluster ?? resolveRegionCluster(user.district);
}
