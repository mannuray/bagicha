import type { User } from '@prisma/client';
import { matchDistrict, type DistrictLocator } from '../../regions';
import { gridCell, type GridCell } from './grid-cell';

/**
 * Where a user's weather comes from: their saved point ("Use my location"),
 * else the centre of their district. A bare name shared by two states matches
 * no district, so it gives no weather rather than another state's.
 */
export function weatherPlace(
  user: Pick<User, 'latitude' | 'longitude' | 'district'>,
  locator: Pick<DistrictLocator, 'centreOf'>,
): GridCell | null {
  if (user.latitude != null && user.longitude != null) {
    return gridCell(user.latitude, user.longitude);
  }
  const district = user.district ? matchDistrict(user.district) : null;
  const centre = district && locator.centreOf(district.name, district.state);
  return centre ? gridCell(centre.lat, centre.lng) : null;
}
