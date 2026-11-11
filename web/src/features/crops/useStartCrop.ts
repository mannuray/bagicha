import { useState } from 'react';
import { useAddJournalEntry } from '../journal';
import { useCropDetail, usePlaces } from './api';
import type { CropItem } from './schemas';
import { startEntry, startProgress, sunMismatch, type StartMethod, type StartPath } from './start-flow';

/** ViewModel for the "Start growing" sheet: the choices so far, the step, and save. */
export function useStartCrop(plantId: string, crop: CropItem, initialPath: StartPath | undefined, onDone: () => void) {
  const log = useAddJournalEntry(plantId);
  const places = usePlaces();
  const detail = useCropDetail(crop.id);
  const nurseryCrop = crop.method === 'NURSERY_TRANSPLANT';
  const [path, setPath] = useState<StartPath | null>(initialPath ?? null);
  // Only nursery crops grown from seed choose a method; everything else sows direct.
  const [method, setMethod] = useState<StartMethod | null>(nurseryCrop ? null : 'DIRECT');
  const [place, setPlace] = useState<string | null>(null);
  const chosen = places.data?.find((p) => p.id === place);

  return {
    nurseryCrop,
    path, setPath,
    method, setMethod,
    place, setPlace,
    places,
    chosen,
    transplanting: path === 'transplant',
    ...startProgress({ path, method, nurseryCrop }),
    sunNote: sunMismatch(crop.sun, chosen?.sun_hours),
    transplantDays: detail.data?.transplant_after_days,
    save: () => log.mutate(startEntry(path, method, place), { onSuccess: onDone }),
    busy: log.isPending,
    error: log.isError ? log.error : null,
  };
}
