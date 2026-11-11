import { useRestorePlant } from '../plants';

/** "Restore" on an ended plant: brings it back to the garden. */
export function usePlantRestore(plantId: string) {
  const restore = useRestorePlant(plantId);
  return { restore: () => restore.mutate(), busy: restore.isPending, error: restore.isError ? restore.error : null };
}
