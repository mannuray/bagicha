import { useMaterializeTasks } from './api';

/** "Refresh this season" on a plant's task list: asks again for its seasonal tasks. */
export function useRefreshSeason(plantId: string) {
  const materialize = useMaterializeTasks();
  return {
    refresh: () => materialize.mutate(plantId),
    busy: materialize.isPending,
    error: materialize.isError ? materialize.error : null,
  };
}
