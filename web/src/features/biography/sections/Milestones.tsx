import { useTranslation } from 'react-i18next';
import { cx, Icon } from '../../../ui';
import type { PlantDetail } from '../../plants';
import { monthYear } from './format';

/** Lifetime firsts, from fields the backend fills as moments are logged. */
export function Milestones({ plant }: { plant: PlantDetail }) {
  const { t, i18n } = useTranslation();
  const planted = plant.planting_date_precision === 'UNKNOWN' ? null : plant.planting_date;
  const items = [
    { key: 'planted', at: planted, label: plant.planting_date_precision === 'YEAR' && planted ? String(new Date(planted).getUTCFullYear()) : null },
    { key: 'firstFlowering', at: plant.first_flowering_at, label: null },
    { key: 'firstFruitSet', at: plant.first_fruit_set_at, label: null },
    { key: 'firstHarvest', at: plant.first_harvest_at, label: null },
    { key: 'latestHarvest', at: plant.latest_harvest_at, label: null },
  ];
  return (
    <section aria-label={t('biography.milestones')} className="space-y-3">
      <h2 className="font-headline text-xl text-primary">{t('biography.milestones')}</h2>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {items.map((m) => (
          <li
            key={m.key}
            className={cx('flex w-28 shrink-0 flex-col gap-1 rounded-xl p-3', m.at ? 'bg-surface-container-low' : 'bg-surface opacity-60')}
          >
            <Icon name={m.at ? 'check_circle' : 'radio_button_unchecked'} filled={Boolean(m.at)} className={cx('text-lg', m.at ? 'text-primary' : 'text-outline')} />
            <span className="font-label text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{t(`biography.milestone.${m.key}`)}</span>
            <span className="font-body text-sm text-on-surface">
              {m.at ? (m.label ?? monthYear(m.at, i18n.language)) : m.key === 'planted' ? t('biography.dateUnknown') : t('biography.notYet')}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
