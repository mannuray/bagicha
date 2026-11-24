import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useStorage } from '../../lib/storage';
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
  const storage = useStorage();
  const photoUpload = usePhotoUpload('journal');
  const save = useAddJournalEntry(plantId);
  const [draft, setDraft] = useState<MomentDraft>(() => loadDraft(plantId, storage) ?? blankMoment());
  const [photo, setPhoto] = useState<File | null>(null);
  const [problem, setProblem] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  // The photo already uploaded for this entry: saving again after a failure
  // reuses it, so the entry (and its retry key) stays the same.
  const uploaded = useRef<{ file: File; key: string } | null>(null);

  useEffect(() => saveDraft(plantId, draft, storage), [plantId, draft, storage]);
  const set = <K extends keyof MomentDraft>(k: K, v: MomentDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setProblem(null);
    try {
      let photoKey: string | null = null;
      if (photo) {
        if (uploaded.current?.file !== photo)
          uploaded.current = { file: photo, key: await photoUpload.upload(photo) };
        photoKey = uploaded.current.key;
      }
      await save.mutateAsync(toMoment(draft, photoKey));
      clearDraft(plantId, storage);
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
