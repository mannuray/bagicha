import { useState } from 'react';
import { istDateString } from '../../lib/ist';
import type { JournalEntry } from '../journal';
import { useEndPlant, type PlantEndReason } from '../plants';
import { toEndPayload } from './end-payload';
import { recentDiagnosis } from './recent-diagnosis';

/** ViewModel for "mark as ended": the reason, day, note, the linked diagnosis, and save. */
export function useEndPlantForm(plantId: string, entries: JournalEntry[], now: Date, onDone: () => void) {
  const end = useEndPlant(plantId);
  const diagnosis = recentDiagnosis(entries, now);
  const [reason, setReason] = useState<PlantEndReason | null>(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [linked, setLinked] = useState(true);
  const today = istDateString(now);

  const save = () => {
    if (!reason) return;
    end.mutate(toEndPayload({ reason, date, note, linked }, today, diagnosis), { onSuccess: onDone });
  };

  return {
    diagnosis, today, reason, setReason, date, setDate, note, setNote, linked,
    toggleLinked: () => setLinked((v) => !v),
    save, busy: end.isPending, error: end.isError ? end.error : null,
  };
}
