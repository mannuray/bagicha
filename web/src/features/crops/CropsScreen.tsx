import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ErrorState, Icon, LoadingState, Pill, Screen, TopBar } from '../../ui';
import { useAllPlants, usePlants } from '../plants';
import { useAddToPlan, useCropCalendar } from './api';
import type { CropItem } from './schemas';

type Filter = 'container' | 'beginner' | 'quick';
const FILTERS: Filter[] = ['container', 'beginner', 'quick'];
const SECTIONS = ['open', 'soon', 'later'] as const;

/** "What can I sow now?": the region's crops by sowing window, to add to Want to grow. */
export function CropsScreen() {
  const { t } = useTranslation();
  const calendar = useCropCalendar();
  const planned = usePlants(1, 'planned');
  const growing = useAllPlants();
  const [filters, setFilters] = useState<Filter[]>([]);
  const onList = new Set(
    [...(planned.data?.items ?? []), ...(growing.data ?? [])].map((p) => p.crop_id).filter((id): id is string => Boolean(id)),
  );
  const toggle = (f: Filter) => setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const visible = (calendar.data ?? []).filter((c) => filters.every((f) => c.tags.includes(f)));

  return (
    <Screen nav>
      <TopBar title={t('crops.title')} />
      <main className="space-y-5 px-4 pb-6 pt-2">
        <p className="font-body text-sm text-on-surface-variant">{t('crops.intro')}</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <Pill key={f} selected={filters.includes(f)} onClick={() => toggle(f)}>
              {t(`crops.filter.${f}`)}
            </Pill>
          ))}
        </div>
        {calendar.isError ? (
          <ErrorState error={calendar.error} onRetry={() => void calendar.refetch()} />
        ) : !calendar.data ? (
          <LoadingState />
        ) : (
          SECTIONS.map((section) => {
            const items = visible.filter((c) => c.status === section);
            if (items.length === 0) return null;
            return (
              <section key={section} aria-label={t(`crops.section.${section}`)} className="space-y-2">
                <h2 className="font-label text-sm font-bold uppercase tracking-[0.1em] text-on-surface-variant">{t(`crops.section.${section}`)}</h2>
                {items.map((crop) => (
                  <CropCard key={crop.id} crop={crop} onList={onList.has(crop.id)} />
                ))}
              </section>
            );
          })
        )}
      </main>
    </Screen>
  );
}

function CropCard({ crop, onList }: { crop: CropItem; onList: boolean }) {
  const { t } = useTranslation();
  const add = useAddToPlan();
  const when =
    crop.status === 'soon'
      ? t('crops.opensIn', { count: crop.opens_in_days ?? 0, window: crop.window_label })
      : t('crops.sowWindow', { window: crop.window_label });
  return (
    <article aria-label={crop.name} className="space-y-1 rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-headline text-lg font-bold text-primary">{crop.name}</h3>
          <p className="font-label text-xs font-bold uppercase tracking-wider text-secondary">{when}</p>
          <p className="font-body text-xs text-on-surface-variant">
            {t(`crops.method.${crop.method}`)} · {t('crops.firstHarvest', { min: crop.days_to_first_harvest[0], max: crop.days_to_first_harvest[1] })}
          </p>
          <p className="font-body text-xs text-on-surface-variant">{t('crops.guideLine', { plants: crop.guide.plants_for_family_of_4, container: crop.guide.container })}</p>
        </div>
        {onList || add.isSuccess ? (
          <span className="flex shrink-0 items-center gap-1 font-label text-xs font-bold text-primary">
            <Icon name="check_circle" filled className="text-base" />
            {t('crops.onList')}
          </span>
        ) : (
          <Button variant="tertiary" busy={add.isPending} onClick={() => add.mutate(crop.id)} className="shrink-0 px-3 text-xs">
            {t('crops.add')}
          </Button>
        )}
      </div>
    </article>
  );
}
