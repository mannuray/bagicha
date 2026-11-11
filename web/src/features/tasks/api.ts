import { useMutation, useQuery } from '@tanstack/react-query';
import { useApi } from '../../lib/api';
import { fetchAllPages } from '../../lib/paging';
import { queryKeys } from '../../lib/query-keys';
import { materializeTasks } from '../seasonal';
import { taskSchema, type Task } from './schemas';
import { staleAfter, useInvalidate } from '../../lib/stale';

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

export function useUpdateTaskStatus() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ task, status }: { task: Task; status: 'COMPLETED' | 'SKIPPED' }) =>
      api.send('PUT', `/ledger/plants/${task.plant_id}/tasks/${task.id}`, { status }, taskSchema),
    onSettled: (_data, _err, { task }) => invalidate(staleAfter.taskChange(task.plant_id)),
  });
}

export function useMaterializeTasks() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (plantId: string) => materializeTasks(api, plantId),
    onSuccess: (_data, plantId) => invalidate(staleAfter.taskChange(plantId)),
  });
}
