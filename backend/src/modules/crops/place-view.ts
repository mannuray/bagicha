import { pickFields } from '../../common/http/pick-fields';

/** A garden place as its owner sees it. */
const PLACE_FIELDS = [
  'id',
  'name',
  'kind',
  'sun_hours',
  'created_at',
  'archived_at',
] as const;

export const toPlaceView = <
  T extends { [K in (typeof PLACE_FIELDS)[number]]?: unknown },
>(
  place: T,
) => pickFields(place, PLACE_FIELDS as unknown as readonly (keyof T)[]);
