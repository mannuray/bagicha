import { useAllCycles, type PlantDetail } from '../plants';
import { useCropCalendar, useCropDetail, usePlaces } from './api';
import { openCycle } from './journey-header';

/** A journey plant's crop, its open season and where it grows (shared by the header and journey card). */
export function useCropContext(plant: PlantDetail) {
  const calendar = useCropCalendar();
  const listed = calendar.data?.find((c) => c.id === plant.crop_id);
  // A retired crop leaves the calendar but not the gardens growing it: fetch it by id.
  const retired = calendar.isSuccess && !listed && Boolean(plant.crop_id);
  const byId = useCropDetail(plant.crop_id ?? '', { enabled: retired });
  const cycles = useAllCycles(plant.id);
  const places = usePlaces();
  const open = openCycle(cycles.data);
  const placeId = open?.place_id ?? null;
  return {
    crop: listed ?? (retired ? byId.data : null) ?? null,
    loading: calendar.isPending || (retired && byId.isPending),
    open,
    place: places.data?.find((p) => p.id === placeId) ?? null,
    placeId,
    /** The plant has never had a season (nothing sown yet). */
    neverSown: cycles.data !== undefined && cycles.data.length === 0,
  };
}
