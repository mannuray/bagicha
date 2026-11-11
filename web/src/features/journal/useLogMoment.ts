import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAddJournalEntry } from './api';
import { clearDraft, loadDraft, saveDraft, type MomentDraft } from './draft';
import { blankMoment, toMoment } from './moment';
import { usePhotoUpload } from './usePhotoUpload';

/**
 * ViewModel for Log a moment: the draft (kept across reloads), the photo, and one
 * submit at a time — upload the photo first, then save the entry, then go back.
 */
export function useLogMoment(plantId: string) {
  const navigate = useNavigate();
  const photoUpload = usePhotoUpload('journal');
  const save = useAddJournalEntry(plantId);
  const [draft, setDraft] = useState<MomentDraft>(() => loadDraft(plantId) ?? blankMoment());
  const [photo, setPhoto] = useState<File | null>(null);
  const [problem, setProblem] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => saveDraft(plantId, draft), [plantId, draft]);
  const set = <K extends keyof MomentDraft>(k: K, v: MomentDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setProblem(null);
    try {
      const photoKey = photo ? await photoUpload.upload(photo) : null;
      await save.mutateAsync(toMoment(draft, photoKey));
      clearDraft(plantId);
      navigate(`/plants/${plantId}`, { replace: true });
    } catch (err) {
      setProblem(err);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return { draft, set, photo, setPhoto, problem, busy, submit };
}
