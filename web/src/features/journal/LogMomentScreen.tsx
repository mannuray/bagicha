import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Chip, ErrorState, Icon, LoadingState, NotInGarden, Screen, TextField, TopBar, isPlantMissing } from '../../ui';
import { usePlant } from '../plants';
import { useAddJournalEntry, type NewMoment } from './api';
import { useImageCompressor } from './compressor-context';
import { clearDraft, loadDraft, saveDraft, type MomentDraft } from './draft';
import { useUploadImage } from './media-api';

const TYPES = ['NOTE', 'WATERING', 'FLOWERING', 'FRUIT_SET', 'FLOWER_DROP', 'FRUIT_DROP', 'HARVEST', 'PRUNING', 'FEEDING', 'TREATMENT', 'PHOTO'] as const;
const DROP_TYPES = new Set(['FLOWER_DROP', 'FRUIT_DROP']);
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
const UNITS = ['kg', 'pieces', 'crates'] as const;
const QUALITIES = ['poor', 'fair', 'good', 'excellent'] as const;

const blank = (): MomentDraft => ({ type: 'NOTE', content: '', unit: 'kg' });

function toMoment(d: MomentDraft, photoKey: string | null): NewMoment {
  const metadata: Record<string, unknown> = {};
  if (photoKey) metadata.photo_key = photoKey;
  if (DROP_TYPES.has(d.type) && d.severity) metadata.severity = d.severity;
  if (d.type === 'HARVEST') {
    if (d.quantity && Number(d.quantity) > 0) metadata.quantity_value = Number(d.quantity);
    if (d.quantity && d.unit) metadata.quantity_unit = d.unit;
    if (d.quality) metadata.quality = d.quality;
  }
  const moment: NewMoment = { type: d.type };
  if (d.content.trim()) moment.content = d.content.trim();
  if (Object.keys(metadata).length > 0) moment.metadata = metadata;
  if (d.date) moment.event_at = new Date(`${d.date}T12:00:00+05:30`).toISOString();
  return moment;
}

/** Stitch "Log a Moment – Quick Entry": what happened, optional photo, harvest details. */
export function LogMomentScreen() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const plant = usePlant(id);

  return (
    <Screen>
      <TopBar title={t('journal.title')} />
      <main className="px-6 pb-16 pt-6">
        {plant.isError ? (
          isPlantMissing(plant.error) ? <NotInGarden /> : <ErrorState error={plant.error} onRetry={() => void plant.refetch()} />
        ) : plant.data ? (
          <MomentForm plantId={id} plantName={plant.data.name} />
        ) : (
          <LoadingState />
        )}
      </main>
    </Screen>
  );
}

function MomentForm({ plantId, plantName }: { plantId: string; plantName: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const compressor = useImageCompressor();
  const upload = useUploadImage('journal');
  const save = useAddJournalEntry(plantId);
  const [draft, setDraft] = useState<MomentDraft>(() => loadDraft(plantId) ?? blank());
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
      let photoKey: string | null = null;
      if (photo) {
        const compressed = await compressor.compress(photo);
        photoKey = (await upload.mutateAsync(compressed.blob)).key;
      }
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

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-6" noValidate>
      <p className="font-headline text-2xl text-primary">{t('journal.forPlant', { name: plantName })}</p>
      <fieldset className="space-y-2">
        <legend className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('journal.what')}</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => (
            <Chip key={type} selected={draft.type === type} onClick={() => set('type', type)}>
              {t(`journal.types.${type}`)}
            </Chip>
          ))}
        </div>
      </fieldset>

      {DROP_TYPES.has(draft.type) && (
        <fieldset className="space-y-2">
          <legend className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('journal.severity')}</legend>
          <div className="flex gap-2">
            {SEVERITIES.map((s) => (
              <Chip key={s} selected={draft.severity === s} onClick={() => set('severity', s)}>
                {t(`journal.severities.${s}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {draft.type === 'HARVEST' && (
        <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
          <TextField label={t('journal.quantity')} type="number" inputMode="decimal" min={0} value={draft.quantity ?? ''} onChange={(e) => set('quantity', e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <Chip key={u} selected={draft.unit === u} onClick={() => set('unit', u)}>
                {t(`journal.units.${u}`)}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {QUALITIES.map((q) => (
              <Chip key={q} selected={draft.quality === q} onClick={() => set('quality', q)}>
                {t(`journal.qualities.${q}`)}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="moment-note" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {t('journal.note')}
        </label>
        <textarea
          id="moment-note"
          rows={4}
          value={draft.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder={t('journal.notePlaceholder')}
          className="ghost-border rounded-lg bg-surface-container px-4 py-3 font-body text-base text-on-surface focus:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <TextField label={t('journal.when')} type="date" value={draft.date ?? ''} onChange={(e) => set('date', e.target.value)} hint={t('journal.whenHint')} />

      <div>
        <label htmlFor="moment-photo" className="flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-xl bg-surface-container-low px-4 py-4 font-label text-sm font-bold text-primary">
          <Icon name="add_a_photo" filled />
          {photo ? t('journal.photoChosen', { name: photo.name }) : t('journal.addPhoto')}
        </label>
        <input id="moment-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </div>

      {problem !== null && (
        <p role="alert" className="rounded-xl bg-error-container px-4 py-3 font-body text-sm text-on-error-container">
          {messageFor(problem)}
        </p>
      )}
      <Button type="submit" block busy={busy}>
        <Icon name="eco" filled />
        {t('journal.save')}
      </Button>
    </form>
  );
}
