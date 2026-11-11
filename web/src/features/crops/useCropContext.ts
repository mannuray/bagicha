import { useAllCycles, type PlantDetail } from '../plants';
import { useCropCalendar, usePlaces } from './api';
import { openCycle } from './journey-header';

/** A journey plant's crop, its open season and where it grows (shared by the header and journey card). */
export function useCropContext(plant: PlantDetail) {
  const calendar = useCropCalendar();
  const cycles = useAllCycles(plant.id);
  const places = usePlaces();
  const open = openCycle(cycles.data);
  const placeId = open?.place_id ?? null;
  return {
    crop: calendar.data?.find((c) => c.id === plant.crop_id) ?? null,
    loading: calendar.isPending,
    open,
    place: places.data?.find((p) => p.id === placeId) ?? null,
    placeId,
    /** The plant has never had a season (nothing sown yet). */
    neverSown: cycles.data !== undefined && cycles.data.length === 0,
  };
}
