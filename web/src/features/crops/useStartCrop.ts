import { useState } from 'react';
import { useAddJournalEntry } from '../journal';
import { useCropDetail, usePlaces } from './api';
import type { CropItem } from './schemas';
import { usePlaceForm } from './usePlaceForm';
import { startEntry, startProgress, sunMismatch, type StartMethod, type StartPath } from './start-flow';

/** ViewModel for the "Start growing" sheet: the choices so far, the step, and save. */
export function useStartCrop(plantId: string, crop: CropItem, initialPath: StartPath | undefined, onDone: () => void) {
  const log = useAddJournalEntry(plantId);
  const places = usePlaces();
  const detail = useCropDetail(crop.id);
  const nurseryCrop = crop.journey === 'NURSERY';
  const [path, setPath] = useState<StartPath | null>(initialPath ?? null);
  // Only nursery crops grown from seed choose a method; everything else sows direct.
  const [method, setMethod] = useState<StartMethod | null>(nurseryCrop ? null : 'DIRECT');
  const [place, setPlace] = useState<string | null>(null);
  const chosen = places.data?.find((p) => p.id === place);
  const placeForm = usePlaceForm(setPlace, places.data ?? []);
  const progress = startProgress({ path, method, nurseryCrop });
  /**
   * On the place step with no existing place picked, the new place is saved first.
   * A nursery tray has no place step and never makes one.
   */
  const save = async () => {
    const pending = progress.step === 'place' && !place;
    const placeId = pending ? await placeForm.add() : place;
    if (pending && !placeId) return;
    log.mutate(startEntry(path, method, placeId), { onSuccess: onDone });
  };

  return {
    nurseryCrop,
    path, setPath,
    method, setMethod,
    place, setPlace, placeForm,
    places,
    chosen,
    transplanting: path === 'transplant',
    ...progress,
    sunNote: sunMismatch(crop.sun, chosen?.sun_hours),
    transplantDays: detail.data?.transplant_after_days,
    save: () => void save(),
    busy: log.isPending || placeForm.busy,
    error: log.isError ? log.error : placeForm.error,
  };
}
