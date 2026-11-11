import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import leavesPhoto from '../../assets/stitch/moment-leaves.jpg';
import { Button, ErrorState, Icon, LoadingState, Pill, TextField } from '../../ui';
import { isPlantMissing, NotInGarden, usePlant } from '../plants';
import { DROP_TYPES } from './moment';
import { useLogMoment } from './useLogMoment';

const TYPES = ['NOTE', 'WATERING', 'FLOWERING', 'FRUIT_SET', 'FLOWER_DROP', 'FRUIT_DROP', 'HARVEST', 'PRUNING', 'FEEDING', 'TREATMENT', 'PHOTO'] as const;
/** Flowers log blooms and bloom care, never fruit. */
const FLOWER_TYPES = ['FLOWERING', 'BLOOM_PEAK', 'DEADHEADING', 'PINCHING', 'PRUNING', 'FEEDING', 'WATERING', 'TREATMENT', 'NOTE', 'PHOTO'] as const;
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
const UNITS = ['kg', 'pieces', 'crates'] as const;
const QUALITIES = ['poor', 'fair', 'good', 'excellent'] as const;

/** Stitch "Log a Moment – Quick Entry": a frosted sheet over the orchard photo. */
export function LogMomentScreen() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const plant = usePlant(id);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-primary-container">
      <img src={leavesPhoto} alt="" className="fixed inset-0 h-full w-full scale-105 object-cover blur-[4px]" />
      <div className="fixed inset-0 bg-black/40" aria-hidden />
      <section className="relative z-10 mx-auto mt-14 flex w-full max-w-[480px] flex-1 flex-col rounded-t-[3rem] bg-surface/90 shadow-[0_-10px_40px_rgba(28,28,25,0.08)] backdrop-blur-2xl">
        <div className="flex justify-center pb-1 pt-3" aria-hidden>
          <div className="h-1.5 w-12 rounded-full bg-outline-variant/40" />
        </div>
        <button
          type="button"
          onClick={() => navigate(`/plants/${id}`, { replace: true })}
          aria-label={t('journal.close')}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-primary hover:bg-surface-container"
        >
          <Icon name="close" />
        </button>
        <div className="flex flex-1 flex-col px-5 pt-2">
          <p className="mb-0.5 font-label text-xs font-bold uppercase tracking-[0.15em] text-secondary">{t('journal.kicker')}</p>
          <h1 className="font-headline text-2xl font-bold text-primary">{t('journal.title')}</h1>
          {plant.isError ? (
            <div className="pt-4">
              {isPlantMissing(plant.error) ? <NotInGarden /> : <ErrorState error={plant.error} onRetry={() => void plant.refetch()} />}
            </div>
          ) : plant.data ? (
            <MomentForm plantId={id} plantName={plant.data.name} flower={plant.data.record_kind === 'FLOWER'} />
          ) : (
            <LoadingState />
          )}
        </div>
      </section>
    </div>
  );
}

function MomentForm({ plantId, plantName, flower = false }: { plantId: string; plantName: string; flower?: boolean }) {
  const { t } = useTranslation();
  const { draft, set, photo, setPhoto, problem, busy, submit } = useLogMoment(plantId);

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-1 flex-col gap-5 pt-1" noValidate>
      <p className="font-body text-sm text-on-surface-variant">{t('journal.forPlant', { name: plantName })}</p>
      <fieldset>
        <legend className="sr-only">{t('journal.what')}</legend>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {(flower ? FLOWER_TYPES : TYPES).map((type) => (
            <Pill key={type} selected={draft.type === type} onClick={() => set('type', type)}>
              {t(`journal.types.${type}`)}
            </Pill>
          ))}
        </div>
      </fieldset>

      {DROP_TYPES.has(draft.type) && (
        <fieldset>
          <legend className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('journal.severity')}</legend>
          <div className="flex flex-wrap gap-2">
            {SEVERITIES.map((s) => (
              <Pill key={s} selected={draft.severity === s} onClick={() => set('severity', s)}>
                {t(`journal.severities.${s}`)}
              </Pill>
            ))}
          </div>
        </fieldset>
      )}

      {draft.type === 'HARVEST' && (
        <div className="space-y-3 rounded-3xl bg-surface-container-low p-4">
          <TextField label={t('journal.quantity')} type="number" inputMode="decimal" min={0} value={draft.quantity ?? ''} onChange={(e) => set('quantity', e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <Pill key={u} selected={draft.unit === u} onClick={() => set('unit', u)}>
                {t(`journal.units.${u}`)}
              </Pill>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {QUALITIES.map((q) => (
              <Pill key={q} selected={draft.quality === q} onClick={() => set('quality', q)}>
                {t(`journal.qualities.${q}`)}
              </Pill>
            ))}
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="moment-photo"
          className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-outline-variant/15 bg-surface-container-low text-primary/70 transition-colors hover:bg-surface-container"
        >
          <Icon name={photo ? 'check_circle' : 'add_a_photo'} filled={Boolean(photo)} className="text-3xl" />
          <span className="font-label text-sm font-medium">{photo ? t('journal.photoChosen', { name: photo.name }) : t('journal.addPhoto')}</span>
        </label>
        <input id="moment-photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </div>

      <div>
        <label htmlFor="moment-note" className="sr-only">
          {t('journal.note')}
        </label>
        <textarea
          id="moment-note"
          rows={4}
          value={draft.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder={t('journal.notePlaceholder')}
          className="min-h-[110px] w-full resize-none rounded-3xl bg-surface-container p-4 font-body text-[15px] text-on-surface shadow-inner transition-colors placeholder:text-on-surface-variant/60 focus:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <TextField label={t('journal.when')} type="date" value={draft.date ?? ''} onChange={(e) => set('date', e.target.value)} hint={t('journal.whenHint')} />

      {problem !== null && (
        <p role="alert" className="rounded-xl bg-error-container px-4 py-3 font-body text-sm text-on-error-container">
          {messageFor(problem)}
        </p>
      )}
      <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-surface via-surface/95 to-transparent px-5 pb-5 pt-4">
        <Button type="submit" block busy={busy} className="py-3 text-sm uppercase tracking-[0.1em]">
          {t('journal.save')}
          <Icon name="arrow_forward" filled className="text-base" />
        </Button>
      </div>
    </form>
  );
}
