import { useState } from 'react';
import { useNow } from '../../lib/clock';
import { useTimeline } from '../journal';
import { plantCategory, type PlantDetail } from '../plants';
import { healthLabel } from './health-label';
import { photoKeyOf } from './sections/format';

/**
 * ViewModel for a plant's page: "now", its record, what kind of plant it is (which
 * sections show), its health line and hero photo, and the "mark as ended" sheet.
 */
export function usePlantPage(plant: PlantDetail) {
  const now = useNow();
  const timeline = useTimeline(plant.id);
  const entries = timeline.data?.items ?? [];
  const category = plantCategory(plant);
  const [ending, setEnding] = useState(false);
  return {
    now,
    entries,
    health: healthLabel(plant, entries, now),
    heroKey: entries.map((e) => photoKeyOf(e)).find(Boolean) ?? null,
    ended: Boolean(plant.ended_at),
    /** A journey plant: a crop or a seasonal flower. */
    crop: category === 'crop' || category === 'seasonalFlower',
    flower: category === 'perennialFlower',
    ending,
    openEnding: () => setEnding(true),
    closeEnding: () => setEnding(false),
  };
}
