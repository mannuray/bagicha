import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Button, cx, Icon } from '../../ui';
import { PlacePicker } from './PlacePicker';
import type { CropItem } from './schemas';
import type { StartPath } from './start-flow';
import { useStartCrop } from './useStartCrop';

/**
 * Start a crop's season from wherever the gardener is: with seeds (sow now),
 * with bought seedlings (transplant now), or later (the reminders do the rest).
 * `transplant` is the follow-up step for a crop already in the nursery.
 * Stitch "Start growing" stepped sheet: path → method (nursery crops, seeds only) → place.
 */
export function StartSheet({ plantId, crop, path: initial, onClose }: { plantId: string; crop: CropItem; path?: StartPath; onClose: () => void }) {
  const { t } = useTranslation();
  const { nurseryCrop, setPath, method, setMethod, place, setPlace, placeForm, chosen, transplanting, step, steps, at, sunNote, transplantDays, save, busy, error } =
    useStartCrop(plantId, crop, initial, onClose);
  const title = transplanting ? t('crops.start.transplantTitle', { crop: crop.name }) : t('crops.start.title', { crop: crop.name });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <section
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-[480px] space-y-4 overflow-y-auto rounded-t-[2.5rem] bg-surface/95 px-4 pb-8 pt-3 shadow-[0_-12px_45px_rgba(23,49,36,0.12)] backdrop-blur-2xl"
      >
        <div className="flex justify-center" aria-hidden>
          <div className="h-1.5 w-12 rounded-full bg-outline-variant/40" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">{t('crops.start.kicker')}</p>
            <h2 className="font-headline text-2xl font-bold text-primary">{title}</h2>
          </div>
          {steps.length > 1 && (
            <ol aria-label={t('crops.start.progress', { at: at + 1, of: steps.length })} className="flex gap-1.5 pt-2">
              {steps.map((s, i) => (
                <li key={s} className={cx('h-2 rounded-full transition-all', i === at ? 'w-6 bg-primary' : i < at ? 'w-2 bg-primary/60' : 'w-2 bg-outline-variant/50')} />
              ))}
            </ol>
          )}
        </div>
        {!transplanting && crop.status !== 'open' && (
          <p className="rounded-[1rem] bg-secondary-container/25 px-3 py-2 font-body text-sm text-on-secondary-fixed-variant">{t('crops.start.outOfSeason')}</p>
        )}

        {step === 'path' && (
          <div className="space-y-2">
            <Option icon="grain" title={t('crops.start.seeds')} badge={nurseryCrop ? null : t('crops.start.recommended')} onClick={() => setPath('seeds')} />
            <Option
              icon="potted_plant"
              title={t('crops.start.seedlings')}
              badge={nurseryCrop ? t('crops.start.quickest') : null}
              onClick={() => setPath('seedlings')}
            />
            <Option icon="notifications" title={t('crops.start.later')} onClick={onClose} quiet />
          </div>
        )}

        {(step === 'method' || step === 'confirm') && (
          <div className="space-y-2">
            {transplantDays && (
              <p className="font-body text-sm text-on-surface-variant">
                {t('crops.start.trayHint', { crop: crop.name, min: transplantDays[0], max: transplantDays[1] })}
              </p>
            )}
            <Option icon="grid_view" title={t('crops.start.nursery')} selected={method === 'NURSERY'} onClick={() => setMethod('NURSERY')} />
            <Option icon="yard" title={t('crops.start.direct')} onClick={() => setMethod('DIRECT')} />
          </div>
        )}

        {step === 'place' && (
          <>
            <PlacePicker cropId={crop.id} value={place} onChange={setPlace} form={placeForm} />
            {sunNote && chosen && (
              <p className="rounded-[1rem] bg-secondary-container/25 px-3 py-2 font-body text-sm text-on-secondary-fixed-variant">
                {t('crops.start.sunNote', { place: chosen.name, sun: t(`crops.place.sunLevel.${chosen.sun_hours}`), crop: crop.name })}
              </p>
            )}
          </>
        )}

        {error && (
          <p role="alert" className="font-body text-sm text-error">
            {messageFor(error, t)}
          </p>
        )}
        {(step === 'place' || step === 'confirm') && (
          <Button busy={busy} onClick={save} className="w-full">
            {transplanting ? t('common.save') : t('crops.start.go')}
          </Button>
        )}
        <button type="button" onClick={onClose} className="min-h-11 w-full font-label text-sm font-semibold uppercase tracking-wider text-primary/60">
          {t('common.cancel')}
        </button>
      </section>
    </div>
  );
}

function Option({
  icon,
  title,
  badge,
  selected = false,
  quiet = false,
  onClick,
}: {
  icon: string;
  title: string;
  badge?: string | null;
  selected?: boolean;
  quiet?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected || undefined}
      className={cx(
        'flex w-full items-center gap-3 rounded-[1.5rem] p-3 text-left transition-colors',
        selected ? 'bg-primary/10 ring-2 ring-primary' : quiet ? 'bg-transparent' : 'bg-surface-container-low',
      )}
    >
      <span className="pebble-small flex h-11 w-11 shrink-0 items-center justify-center bg-secondary-container/60 text-on-secondary-container">
        <Icon name={icon} filled />
      </span>
      <span className="min-w-0 flex-1 font-headline text-base font-bold text-primary">{title}</span>
      {badge && <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 font-label text-[10px] font-bold uppercase tracking-wider text-on-secondary">{badge}</span>}
    </button>
  );
}
