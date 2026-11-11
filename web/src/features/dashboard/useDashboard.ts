import { useState } from 'react';
import { useNow } from '../../lib/clock';
import { istHour } from '../../lib/format';
import { useSession } from '../auth';
import { useCropSyncOnce } from '../crops';
import { gardenCounts, useAllPlants, usePlants, usesSeasonPack } from '../plants';
import { useSeasonalGuide } from '../seasonal';
import { useMyTasks } from '../tasks';
import { greetingFor } from './greeting';
import { useSessionMaterialize } from './use-session-materialize';

/**
 * ViewModel for Home: the garden summary, this week's tasks, the season guide and
 * the greeting; asks once per sign-in for tree tasks and the crop plan sync.
 */
export function useDashboard() {
  const { user } = useSession();
  const now = useNow();
  const plants = useAllPlants();
  const season = useSessionMaterialize(plants.data?.filter(usesSeasonPack).map((p) => p.id));
  useCropSyncOnce();
  const [adding, setAdding] = useState(false);
  const planned = usePlants(1, 'planned').data?.pagination.total_items ?? 0;
  const counts = plants.data ? gardenCounts(plants.data) : null;
  return {
    user,
    now,
    greeting: greetingFor(istHour(now)),
    plants,
    season,
    counts,
    planned,
    tasks: useMyTasks(),
    guide: useSeasonalGuide(),
    adding,
    setAdding,
  };
}
