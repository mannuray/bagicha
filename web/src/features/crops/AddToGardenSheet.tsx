import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '../../ui';
import { useCropCalendar } from './api';
import { shortName } from './names';

/** Stitch "Add to your garden": choose a tree or a vegetable. */
export function AddToGardenSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const calendar = useCropCalendar();
  const sowNow = (calendar.data ?? []).filter((c) => c.kind === 'CROP' && c.status === 'open').slice(0, 3).map(shortName);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <section
        role="dialog"
        aria-label={t('crops.chooser.title')}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] space-y-4 rounded-t-[2.5rem] bg-surface/95 px-4 pb-8 pt-3 shadow-[0_-12px_45px_rgba(23,49,36,0.12)] backdrop-blur-2xl"
      >
        <div className="flex justify-center" aria-hidden>
          <div className="h-1.5 w-12 rounded-full bg-outline-variant/40" />
        </div>
        <div>
          <p className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">{t('crops.chooser.kicker')}</p>
          <h2 className="font-headline text-2xl font-bold text-primary">{t('crops.chooser.title')}</h2>
        </div>
        <Link to="/plants/new" className="flex items-center gap-3 rounded-[1.75rem] bg-surface-container-low p-4" onClick={onClose}>
          <span className="pebble-large flex h-14 w-14 shrink-0 items-center justify-center bg-primary-gradient text-on-primary"><Icon name="park" filled /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-headline text-lg font-bold text-primary">{t('crops.chooser.tree')}</span>
            <span className="block font-body text-xs text-on-surface-variant">{t('crops.chooser.treeHint')}</span>
          </span>
          <Icon name="chevron_right" className="text-outline" />
        </Link>
        <Link to="/crops" className="flex flex-col gap-2 rounded-[1.75rem] bg-surface-container-low p-4" onClick={onClose}>
          <span className="flex items-center gap-3">
            <span className="pebble-small flex h-14 w-14 shrink-0 items-center justify-center bg-secondary-container text-on-secondary-container"><Icon name="eco" filled /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-headline text-lg font-bold text-primary">{t('crops.chooser.vegetable')}</span>
              <span className="block font-body text-xs text-on-surface-variant">{t('crops.chooser.vegetableHint')}</span>
            </span>
            <Icon name="chevron_right" className="text-outline" />
          </span>
          {sowNow.length > 0 && (
            <span className="self-start rounded-full bg-secondary/10 px-3 py-1 font-label text-[11px] font-semibold text-secondary">
              {t('crops.chooser.sowNow', { crops: sowNow.join(', ') })}
            </span>
          )}
        </Link>
        <Link to="/crops?kind=flower" className="flex items-center gap-3 rounded-[1.75rem] bg-surface-container-low p-4" onClick={onClose}>
          <span className="pebble-large flex h-14 w-14 shrink-0 items-center justify-center bg-secondary-container/60 text-on-secondary-container"><Icon name="local_florist" filled /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-headline text-lg font-bold text-primary">{t('crops.chooser.flower')}</span>
            <span className="block font-body text-xs text-on-surface-variant">{t('crops.chooser.flowerHint')}</span>
          </span>
          <Icon name="chevron_right" className="text-outline" />
        </Link>
        <button type="button" onClick={onClose} className="min-h-11 w-full font-label text-sm font-semibold uppercase tracking-wider text-primary/60">
          {t('common.cancel')}
        </button>
      </section>
    </div>
  );
}

/** A "+" that opens the chooser (used where a feature can't import crops directly). */
export function AddToGardenButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label={t('crops.chooser.open')} onClick={() => setOpen(true)} className={className}>
        <Icon name="add" />
      </button>
      {open && <AddToGardenSheet onClose={() => setOpen(false)} />}
    </>
  );
}
