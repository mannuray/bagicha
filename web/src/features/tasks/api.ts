import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../lib/api';
import type { ApiClient } from '../../lib/api-client';
import { fetchAllPages } from '../../lib/paging';
import { queryKeys } from '../../lib/query-keys';
import { materializeSchema, taskSchema, type Task } from './schemas';

/** All of the user's tasks: "this week" groups them client-side, so a page cut would hide some. */
export function useMyTasks() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.tasks.mineAll,
    queryFn: async () => ({ items: await fetchAllPages(api, '/ledger/tasks', taskSchema) }),
  });
}

export function usePlantTasks(plantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plants.tasks(plantId),
    queryFn: async () => ({ items: await fetchAllPages(api, `/ledger/plants/${plantId}/tasks`, taskSchema) }),
    enabled: Boolean(plantId),
  });
}

/** Everything a task status change can affect. */
function invalidateTaskViews(client: ReturnType<typeof useQueryClient>, plantId: string | null) {
  void client.invalidateQueries({ queryKey: queryKeys.tasks.mineAll });
  if (plantId) {
    void client.invalidateQueries({ queryKey: queryKeys.plants.tasks(plantId) });
    void client.invalidateQueries({ queryKey: queryKeys.plants.mitigation(plantId) });
    void client.invalidateQueries({ queryKey: queryKeys.plants.cycles(plantId) });
  }
}

export function useUpdateTaskStatus() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ task, status }: { task: Task; status: 'COMPLETED' | 'SKIPPED' }) =>
      api.send('PUT', `/ledger/plants/${task.plant_id}/tasks/${task.id}`, { status }, taskSchema),
    onSettled: (_data, _err, { task }) => invalidateTaskViews(client, task.plant_id),
  });
}

/**
 * The one call that asks the backend for a plant's tasks this season. Idempotent:
 * existing ones come back skipped. Used by the hook below, plant creation and the
 * dashboard's once-per-session check.
 */
export function materializeTasks(api: ApiClient, plantId: string) {
  return api.send('POST', `/seasonal/plant/${plantId}/materialize-tasks`, {}, materializeSchema);
}

export function useMaterializeTasks() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (plantId: string) => materializeTasks(api, plantId),
    onSuccess: (_data, plantId) => invalidateTaskViews(client, plantId),
  });
}
