import type { TFunction } from 'i18next';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { istDayDiff } from '../../lib/ist';
import { Button, cx, EmptyState, ErrorState, Icon, LoadingState, Screen } from '../../ui';
import { usePlants } from './api';
import type { Plant } from './schemas';

type Status = 'active' | 'planned' | 'ended';
type Group = 'all' | 'trees' | 'crops' | 'flowers';
const GROUPS: Group[] = ['all', 'trees', 'crops', 'flowers'];

/** "Harvesting · day 40" for a growing crop; "Mature · planted 2015" for a tree. */
function statusLine(plant: Plant, t: TFunction): string {
  if (plant.crop_stage) {
    const day = plant.season_started_at ? Math.max(0, istDayDiff(new Date(plant.season_started_at), new Date())) : null;
    const flowerBloom = plant.record_kind === 'FLOWER' && plant.crop_stage === 'HARVESTING';
    return [t(flowerBloom ? 'crops.stage.BLOOMING' : `crops.stage.${plant.crop_stage}`), day === null ? null : t('plants.list.day', { day })].filter(Boolean).join(' · ');
  }
  const year = plant.planting_date && plant.planting_date_precision !== 'UNKNOWN' ? new Date(plant.planting_date).getUTCFullYear() : null;
  // A perennial flower is young, then blooming; trees use their lifecycle stage.
  const stage =
    plant.record_kind === 'FLOWER'
      ? t(plant.lifecycle_stage === 'SAPLING' || plant.lifecycle_stage === 'JUVENILE' ? 'biography.flower.stage.YOUNG' : 'biography.flower.stage.BLOOMING')
      : t(`plants.stage.${plant.lifecycle_stage}`);
  return [stage, year ? t('plants.list.planted', { year }) : null].filter(Boolean).join(' · ');
}

/** Stitch "Orchard Gallery": growing plants by group (trees, crops), with Want to grow and Past tabs. */
/** `addSlot` lets the app put the garden chooser here without plants importing crops. */
export function PlantListScreen({ addSlot }: { addSlot?: ReactNode } = {}) {
  const { t } = useTranslation();
  // Home's garden tile links here with ?group=trees|crops (and &tab=planned for Want to grow).
  const [params, setParams] = useSearchParams();
  const group: Group = GROUPS.includes(params.get('group') as Group) ? (params.get('group') as Group) : 'all';
  const [status, setStatus] = useState<Status>(params.get('tab') === 'planned' ? 'planned' : params.get('tab') === 'ended' ? 'ended' : 'active');
  const [pages, setPages] = useState(1);
  const choose = (next: Status) => {
    setStatus(next);
    setPages(1);
  };
  const chooseGroup = (next: Group) => {
    setParams(next === 'all' ? {} : { group: next }, { replace: true });
    setPages(1);
  };
  const kind = group === 'trees' ? 'tree' : group === 'crops' ? 'crop' : group === 'flowers' ? 'flower' : undefined;

  return (
    <Screen nav>
      <header className="flex items-end justify-between px-4 pb-4 pt-6">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('plants.list.kicker')}</p>
          <h1 className="font-headline text-2xl text-primary">{t('plants.list.title')}</h1>
        </div>
        {addSlot ?? (
          <Link
            to="/plants/new"
            aria-label={t('plants.list.add')}
            className="bg-primary-gradient flex h-12 w-12 items-center justify-center rounded-full text-on-primary shadow-lg"
          >
            <Icon name="add" />
          </Link>
        )}
      </header>
      <main className="space-y-3 px-4">
        <div className="flex gap-2">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => chooseGroup(g)}
              className={cx(
                'min-h-9 rounded-full px-4 font-label text-xs font-semibold transition-colors duration-150',
                group === g ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant',
              )}
            >
              {t(`plants.list.group.${g}`)}
            </button>
          ))}
        </div>
        <div role="tablist" className="flex gap-2">
          {(['active', 'planned', 'ended'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => choose(s)}
              className={cx(
                'min-h-11 rounded-full px-5 font-label text-xs font-bold uppercase tracking-wider transition-colors duration-150',
                status === s ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary/70',
              )}
            >
              {t(s === 'active' ? 'plants.list.growing' : s === 'planned' ? 'plants.list.planned' : 'plants.list.past')}
            </button>
          ))}
        </div>
        {status === 'planned' && (
          <Link to="/crops" className="flex min-h-11 items-center gap-2 font-label text-sm font-bold text-secondary">
            <Icon name="search" />
            {t('crops.find')}
          </Link>
        )}
        {Array.from({ length: pages }, (_, i) => (
          <PlantPage key={`${group}-${status}-${i}`} status={status} kind={kind} page={i + 1} isLast={i + 1 === pages} onMore={() => setPages((p) => p + 1)} />
        ))}
      </main>
    </Screen>
  );
}

function PlantPage({ status, kind, page, isLast, onMore }: { status: Status; kind?: 'tree' | 'crop' | 'flower'; page: number; isLast: boolean; onMore: () => void }) {
  const { t } = useTranslation();
  const query = usePlants(page, status, kind);

  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (query.isPending) return <LoadingState />;
  const { items, pagination } = query.data;

  if (page === 1 && items.length === 0 && status === 'planned') {
    return <p className="py-6 text-center font-body text-sm text-on-surface-variant">{t('plants.list.emptyPlanned')}</p>;
  }
  if (page === 1 && items.length === 0 && status === 'ended') {
    return <p className="py-6 text-center font-body text-sm text-on-surface-variant">{t('plants.list.emptyPast')}</p>;
  }
  if (page === 1 && items.length === 0) {
    return (
      <EmptyState
        title={t('plants.list.emptyTitle')}
        body={t('plants.list.emptyBody')}
        action={
          <Link to="/plants/new" className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-4 font-label text-sm font-bold text-on-primary">
            {t('plants.list.addFirst')}
          </Link>
        }
      />
    );
  }

  return (
    <>
      {items.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
      {isLast && pagination.has_next && (
        <Button variant="tertiary" block onClick={onMore}>
          {t('common.loadMore')}
        </Button>
      )}
    </>
  );
}

function PlantCard({ plant }: { plant: Plant }) {
  const { t, i18n } = useTranslation();
  return (
    <Link
      to={`/plants/${plant.id}`}
      className="flex items-center gap-3 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
    >
      <span className="pebble-large flex h-12 w-12 shrink-0 items-center justify-center bg-primary-gradient text-on-primary">
        <Icon name={plant.record_kind === 'TREE' ? 'park' : plant.record_kind === 'FLOWER' ? 'local_florist' : 'grass'} filled />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-headline text-lg text-primary">{plant.name}</span>
        <span className="block truncate font-body text-sm text-on-surface-variant">
          {[plant.species, plant.variety].filter(Boolean).join(' · ')}
        </span>
        <span className="mt-1 block font-label text-[11px] font-bold uppercase tracking-widest text-secondary">
          {plant.ended_at
            ? t('plants.list.pastLine', {
                reason: t(`biography.end.reason.${plant.end_reason ?? 'UNKNOWN_CAUSE'}`),
                date: new Date(plant.ended_at).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }),
              })
            : statusLine(plant, t)}
        </span>
      </span>
      <Icon name="chevron_right" className="text-outline" />
    </Link>
  );
}
