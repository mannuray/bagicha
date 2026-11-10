import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, ErrorState, Icon, Screen, TextField, cx } from '../../ui';
import { useImageCompressor } from '../journal';
import { useAllPlants } from '../plants';
import { useScanState, type ScanMode } from './scan-state';

/** Stitch "Vision Scan": choose identify or diagnose, pick the tree, take a photo. */
export function ScanScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const compressor = useImageCompressor();
  const plants = useAllPlants();
  const { setScan } = useScanState();
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
        previewUrl: typeof URL.createObjectURL === 'function' ? URL.createObjectURL(compressed.blob) : null,
        ...(mode === 'diagnose' ? { plantId, plantName, note: note.trim() || undefined } : {}),
      });
      navigate(mode === 'diagnose' ? '/scan/diagnose' : '/scan/identify');
    } catch (err) {
      setProblem(err);
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <Screen nav>
      <header className="px-6 pb-6 pt-10">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('scan.kicker')}</p>
        <h1 className="font-headline text-4xl text-primary">{t('scan.title')}</h1>
      </header>
      <form onSubmit={(e) => void submit(e)} className="space-y-6 px-6" noValidate>
        <div className="grid grid-cols-2 gap-3">
          {(['diagnose', 'identify'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cx(
                'flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl p-4 text-center transition-colors',
                mode === m ? 'bg-primary-gradient text-on-primary' : 'bg-surface-container-low text-primary',
              )}
            >
              <Icon name={m === 'diagnose' ? 'healing' : 'search'} filled={mode === m} />
              <span className="font-label text-sm font-bold">{t(`scan.mode.${m}`)}</span>
            </button>
          ))}
        </div>

        {mode === 'diagnose' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="scan-tree" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t('scan.whichTree')}
              </label>
              <select
                id="scan-tree"
                value={plantId}
                onChange={(e) => {
                  setPlantId(e.target.value);
                  setNeedTree(false);
                }}
                className="ghost-border min-h-12 rounded-lg bg-surface-container px-4 font-body text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t('scan.chooseTree')}</option>
                {plants.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {needTree && <p className="font-body text-sm text-error">{t('scan.needTree')}</p>}
              {plants.isError && <ErrorState error={plants.error} onRetry={() => void plants.refetch()} />}
            </div>
            <TextField label={t('scan.note')} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        )}

        <label htmlFor="scan-photo" className="pebble-large flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-3 bg-surface-container-low text-primary">
          <Icon name="photo_camera" filled className="text-5xl" />
          <span className="font-label text-sm font-bold">{photo ? photo.name : t('scan.takePhoto')}</span>
        </label>
        <input id="scan-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />

        {problem !== null && (
          <p role="alert" className="rounded-xl bg-error-container px-4 py-3 font-body text-sm text-on-error-container">
            {messageFor(problem)}
          </p>
        )}
        <Button type="submit" block busy={busy} disabled={!photo}>
          {t(`scan.submit.${mode}`)}
        </Button>
      </form>
    </Screen>
  );
}
