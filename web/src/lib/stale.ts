import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

/**
 * What each kind of change makes stale — the one place that knows who depends on
 * what. A mutation names the change ("a journal entry for p1"); it doesn't list
 * other features' caches.
 */
export const staleAfter = {
  /** A plant added, ended or restored, or a crop put on / taken off the plan. */
  gardenChange: (): QueryKey[] => [queryKeys.plants.all, queryKeys.tasks.mineAll],
  /** A plant's own details edited. */
  plantEdit: (): QueryKey[] => [queryKeys.plants.all],
  /** A journal entry logged for a plant (it can open a season, add tasks, set milestones). */
  journalWrite: (plantId: string): QueryKey[] => [
    queryKeys.plants.timelineAll(plantId),
    queryKeys.plants.cycles(plantId),
    queryKeys.plants.tasks(plantId),
    queryKeys.plants.detail(plantId),
    queryKeys.plants.mitigation(plantId),
    queryKeys.tasks.mineAll,
  ],
  /** A task done, skipped or created (by a status change or a season's tasks). */
  taskChange: (plantId: string | null): QueryKey[] =>
    plantId
      ? [queryKeys.tasks.mineAll, queryKeys.plants.tasks(plantId), queryKeys.plants.mitigation(plantId), queryKeys.plants.cycles(plantId)]
      : [queryKeys.tasks.mineAll],
  /** A scan diagnosis saved for a plant (an entry and maybe a follow-up task). */
  diagnosis: (plantId: string): QueryKey[] => [queryKeys.plants.tasks(plantId), queryKeys.plants.timelineAll(plantId), queryKeys.tasks.mineAll],
  /** The user's district or region changed: the season guide and crop calendar follow the region. */
  regionChange: (): QueryKey[] => [queryKeys.guide, queryKeys.crops.calendar],
  /** A garden place added. */
  places: (): QueryKey[] => [queryKeys.crops.places],
};

/** Marks the given caches stale so the screens showing them refetch. */
export function invalidate(client: QueryClient, keys: QueryKey[]): void {
  for (const queryKey of keys) void client.invalidateQueries({ queryKey });
}

/** `invalidate` bound to the app's query client. */
export function useInvalidate() {
  const client = useQueryClient();
  return (keys: QueryKey[]) => invalidate(client, keys);
}
