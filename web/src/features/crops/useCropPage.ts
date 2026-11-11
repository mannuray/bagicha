import { useNavigate } from 'react-router';
import { useAddToPlan, useCropDetail } from './api';
import { useCropsOnList } from './useCropsOnList';

/** ViewModel for a crop's page: its details, whether it's on your list, add it, or start it now. */
export function useCropPage(cropId: string) {
  const navigate = useNavigate();
  const detail = useCropDetail(cropId);
  const onList = useCropsOnList().has(cropId);
  const add = useAddToPlan();
  return {
    detail,
    onList: onList || add.isSuccess,
    addToList: () => add.mutate(cropId),
    /** Add it, then open its journey with the start sheet. */
    startNow: () => add.mutate(cropId, { onSuccess: (plant) => void navigate(`/plants/${plant.id}?start=1`) }),
    busy: add.isPending,
    error: add.isError ? add.error : null,
  };
}
