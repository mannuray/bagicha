import { useAllPlanned, useAllPlants } from '../plants';

/** Crops already in the garden or on Want to grow, by crop id ("on your list"). */
export function useCropsOnList(): Set<string> {
  const planned = useAllPlanned();
  const growing = useAllPlants();
  const ids = [...(planned.data ?? []), ...(growing.data ?? [])].map((p) => p.crop_id);
  return new Set(ids.filter((id): id is string => Boolean(id)));
}
