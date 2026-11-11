import { useAddToPlan } from './api';

/** ViewModel for a crop card's "Add to Want to grow": on the list once added (or already). */
export function useAddCropToPlan(cropId: string, alreadyOnList: boolean) {
  const add = useAddToPlan();
  return { add: () => add.mutate(cropId), busy: add.isPending, onList: alreadyOnList || add.isSuccess };
}
