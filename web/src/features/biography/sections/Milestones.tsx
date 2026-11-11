import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { systemClock } from '../../../lib/clock';
import { cx, Icon } from '../../../ui';
import type { PlantDetail } from '../../plants';
import { milestoneView, type FirstKey, type MilestoneView } from '../milestone-view';
import { monthYear } from './format';

const FIRSTS: FirstKey[] = ['firstFlowering', 'firstFruitSet', 'firstHarvest'];

/**
 * Lifetime firsts. A tree that predates Bagicha shows the gardener's answer or an
 * estimate (clearly marked), not "Not yet" (spec 2026-11-11-old-tree-milestones).
 */
export function Milestones({ plant }: { plant: PlantDetail }) {
  const { t, i18n } = useTranslation();
  const now = systemClock.now();
  const planted = plant.planting_date_precision === 'UNKNOWN' ? null : plant.planting_date;
  const plantedText = planted
    ? plant.planting_date_precision === 'YEAR'
      ? String(new Date(planted).getUTCFullYear())
      : monthYear(planted, i18n.language)
    : t('biography.dateUnknown');

  const firstText = (view: MilestoneView): string => {
    switch (view.kind) {
      case 'recorded':
        return monthYear(view.at, i18n.language);
      case 'since':
        return t('biography.since', { year: view.year });
      case 'before':
        return t('biography.beforeBagicha');
      case 'estimate':
        return view.from === view.to
          ? t('biography.aroundYear', { year: view.from })
          : t('biography.around', { from: view.from, to: view.to });
      case 'notYet':
        return t('biography.notYet');
    }
  };

  const items = [
    { key: 'planted', reached: Boolean(planted), text: plantedText, estimated: false },
    ...FIRSTS.map((key) => {
      const view = milestoneView(plant, key, now);
      return { key, reached: view.kind !== 'notYet', text: firstText(view), estimated: view.kind === 'estimate' };
    }),
    {
      key: 'latestHarvest',
      reached: Boolean(plant.latest_harvest_at),
      text: plant.latest_harvest_at ? monthYear(plant.latest_harvest_at, i18n.language) : t('biography.notYet'),
      estimated: false,
    },
  ];

  return (
    <section aria-label={t('biography.milestones')} className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-headline text-xl text-primary">{t('biography.milestones')}</h2>
        {plant.record_kind === 'TREE' && !plant.ended_at && (
          <Link to={`/plants/${plant.id}/edit`} className="inline-flex min-h-11 items-center font-label text-sm font-bold text-secondary">
            {t('biography.editMilestones')}
          </Link>
        )}
      </div>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {items.map((m) => (
          <li
            key={m.key}
            className={cx('flex w-28 shrink-0 flex-col gap-1 rounded-xl p-3', m.reached ? 'bg-surface-container-low' : 'bg-surface opacity-60')}
          >
            <Icon name={m.reached ? 'check_circle' : 'radio_button_unchecked'} filled={m.reached} className={cx('text-lg', m.reached ? 'text-primary' : 'text-outline')} />
            <span className="font-label text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{t(`biography.milestone.${m.key}`)}</span>
            <span className="font-body text-sm text-on-surface">{m.text}</span>
            {m.estimated && <span className="font-label text-[10px] italic text-on-surface-variant">{t('biography.estimated')}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
