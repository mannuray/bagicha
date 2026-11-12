import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useNow } from '../../lib/clock';
import { monthYear } from '../../lib/format';
import { Button, cx, EmptyState, ErrorState, Icon, LoadingState, Screen } from '../../ui';
import { usePlants } from './api';
import type { Plant } from './schemas';
import { plantStatus } from './status';
import { LIST_GROUPS, type ListStatus } from './list-view';
import { usePlantList } from './usePlantList';

type Status = ListStatus;

/** The empty card invites what the chosen group holds (same places as the add sheet). */
const EMPTY_INVITE = {
  tree: { to: '/plants/new', body: 'plants.list.emptyBody', action: 'plants.list.addFirst' },
  crop: { to: '/crops', body: 'plants.list.empty.crop.body', action: 'plants.list.empty.crop.action' },
  flower: { to: '/crops?kind=flower', body: 'plants.list.empty.flower.body', action: 'plants.list.empty.flower.action' },
} as const;
const GROUPS = LIST_GROUPS;

/** "Harvesting · day 40" for a growing crop; "Mature · planted 2015" for a tree. */
function statusLine(plant: Plant, t: TFunction, now: Date): string {
  const { stageKey, day, plantedYear } = plantStatus(plant, now);
  return [t(stageKey), day === null ? null : t('plants.list.day', { day }), plantedYear ? t('plants.list.planted', { year: plantedYear }) : null]
    .filter(Boolean)
    .join(' · ');
}

/** Stitch "Orchard Gallery": growing plants by group (trees, crops), with Want to grow and Past tabs. */
/** `addSlot` lets the app put the garden chooser here without plants importing crops. */
export function PlantListScreen({ addSlot }: { addSlot?: ReactNode } = {}) {
  const now = useNow();
  const { t } = useTranslation();
  const { group, status, kind, pages, chooseGroup, chooseStatus: choose, more } = usePlantList();

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
          <PlantPage key={`${group}-${status}-${i}`} status={status} kind={kind} page={i + 1} isLast={i + 1 === pages} onMore={more} now={now} />
        ))}
      </main>
    </Screen>
  );
}

function PlantPage({ status, kind, page, isLast, onMore, now }: { status: Status; kind?: 'tree' | 'crop' | 'flower'; page: number; isLast: boolean; onMore: () => void; now: Date }) {
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
    const invite = EMPTY_INVITE[kind ?? 'tree'];
    return (
      <EmptyState
        title={t('plants.list.emptyTitle')}
        body={t(invite.body)}
        action={
          <Link to={invite.to} className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-4 font-label text-sm font-bold text-on-primary">
            {t(invite.action)}
          </Link>
        }
      />
    );
  }

  return (
    <>
      {items.map((plant) => (
        <PlantCard key={plant.id} plant={plant} now={now} />
      ))}
      {isLast && pagination.has_next && (
        <Button variant="tertiary" block onClick={onMore}>
          {t('common.loadMore')}
        </Button>
      )}
    </>
  );
}

function PlantCard({ plant, now }: { plant: Plant; now: Date }) {
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
                date: monthYear(plant.ended_at, i18n.language),
              })
            : statusLine(plant, t, now)}
        </span>
      </span>
      <Icon name="chevron_right" className="text-outline" />
    </Link>
  );
}
