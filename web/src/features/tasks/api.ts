import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query-keys';
import { materializeSchema, taskSchema, type Task } from './schemas';

const PAGE_SIZE = 50;

export function useMyTasks(page = 1) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.tasks.mine(page),
    queryFn: () => api.getPage('/ledger/tasks', taskSchema, { page, page_size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

export function usePlantTasks(plantId: string, page = 1) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.plants.tasks(plantId), page],
    queryFn: () => api.getPage(`/ledger/plants/${plantId}/tasks`, taskSchema, { page, page_size: PAGE_SIZE }),
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

/** Ask the backend for this season's tasks. Idempotent: existing ones come back skipped. */
export function useMaterializeTasks() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (plantId: string) =>
      api.send('POST', `/seasonal/plant/${plantId}/materialize-tasks`, {}, materializeSchema),
    onSuccess: (_data, plantId) => invalidateTaskViews(client, plantId),
  });
}
