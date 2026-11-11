import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useImageCompressor } from '../journal';
import { useAllPlants } from '../plants';
import { useScanState, type ScanMode } from './scan-state';

/**
 * ViewModel for Scan: identify or diagnose, which tree, a note and the photo.
 * Submitting compresses the photo once, hands it to the result screen, and goes there.
 */
export function useStartScan() {
  const navigate = useNavigate();
  const compressor = useImageCompressor();
  const plants = useAllPlants();
  const { setScan, previewOf } = useScanState();
  const [mode, setMode] = useState<ScanMode>('diagnose');
  const [plantId, setPlantId] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [problem, setProblem] = useState<unknown>(null);
  const [needTree, setNeedTree] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !photo) return;
    if (mode === 'diagnose' && !plantId) {
      setNeedTree(true);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setProblem(null);
    try {
      const compressed = await compressor.compress(photo);
      const plantName = plants.data?.find((p) => p.id === plantId)?.name;
      setScan({
        mode,
        base64: compressed.base64,
        previewUrl: previewOf(compressed.blob),
        ...(mode === 'diagnose' ? { plantId, plantName, note: note.trim() || undefined } : {}),
      });
      navigate(mode === 'diagnose' ? '/scan/diagnose' : '/scan/identify');
    } catch (err) {
      setProblem(err);
      inFlight.current = false;
      setBusy(false);
    }
  };

  return { plants, mode, setMode, plantId, setPlantId, note, setNote, photo, setPhoto, problem, needTree, setNeedTree, busy, submit };
}
