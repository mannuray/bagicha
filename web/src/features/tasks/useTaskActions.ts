import { useUpdateTaskStatus } from './api';
import type { Task } from './schemas';

/** ViewModel for a task card's Mark done / Skip: one at a time; errors go to `onError` when given. */
export function useTaskActions(task: Task, onError?: (err: unknown) => void) {
  const update = useUpdateTaskStatus();
  const act = (status: 'COMPLETED' | 'SKIPPED') => {
    if (update.isPending) return;
    update.mutate({ task, status }, { onError });
  };
  return {
    complete: () => act('COMPLETED'),
    skip: () => act('SKIPPED'),
    busy: update.isPending,
    error: update.error,
  };
}
