import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import orchardPhoto from '../../assets/stitch/dashboard-orchard.jpg';
import { systemClock } from '../../lib/clock';
import { EmptyState, ErrorState, Icon, LoadingState, Pebble, Screen } from '../../ui';
import { useSession } from '../auth';
import { AddToGardenSheet, useCropSyncOnce } from '../crops';
import { useAllPlants, usePlants } from '../plants';
import { useSeasonalGuide } from '../seasonal';
import { hasPendingSoon, TaskGroups, useMyTasks } from '../tasks';
import { useSessionMaterialize } from './use-session-materialize';

const PREVIEW = 5;

/** Stitch "Home Dashboard – Sanctuary", with its orchard photo. The weather card is hidden until weather is real. */
export function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useSession();
  const plants = useAllPlants();
  // Journey crops follow the crop calendar, not the tree season pack.
  const season = useSessionMaterialize(plants.data?.filter((p) => !p.crop_id).map((p) => p.id));
  useCropSyncOnce();
  const [adding, setAdding] = useState(false);
  // The garden at a glance: trees, crops growing now, and Want to grow underneath.
  const planned = usePlants(1, 'planned').data?.pagination.total_items ?? 0;
  const trees = plants.data ? plants.data.filter((p) => !p.crop_id).length : null;
  const crops = plants.data ? plants.data.filter((p) => p.crop_id).length : null;
  const tasks = useMyTasks();
  const guide = useSeasonalGuide();
  const now = systemClock.now();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <Screen nav>
      <header className="relative overflow-hidden rounded-b-xl bg-primary-container px-4 pb-12 pt-24 text-on-primary shadow-[0_10px_40px_rgba(28,28,25,0.06)]">
        <img src={orchardPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" aria-hidden />
        <p className="relative font-label text-xs uppercase tracking-widest text-primary-fixed-dim">
          {[user?.district, guide.data?.season].filter(Boolean).join(' • ')}
        </p>
        <h1 className="relative mt-1 font-display text-2xl leading-tight tracking-tight">
          {t(`dashboard.greeting.${greeting}`)}{' '}
          {user?.name ?? t('profile.noName')}
        </h1>
      </header>

      <main className="relative z-10 -mt-6 space-y-5 px-4">
        <section aria-labelledby="week-heading" className="space-y-2 rounded-xl bg-surface pt-3">
          <div className="flex items-baseline justify-between">
            <h2 id="week-heading" className="ml-2 font-label text-sm font-bold uppercase tracking-widest text-outline">
              {t('dashboard.thisWeek')}
            </h2>
            <Link to="/tasks" className="font-label text-sm font-bold text-secondary">
              {t('common.seeAll')}
            </Link>
          </div>
          {tasks.isError ? (
            <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
          ) : tasks.data && hasPendingSoon(tasks.data.items, now) ? (
            <TaskGroups tasks={tasks.data.items} now={now} limit={PREVIEW} />
          ) : plants.isError ? (
            <ErrorState error={plants.error} onRetry={() => void plants.refetch()} />
          ) : season.error ? (
            <ErrorState error={season.error} onRetry={season.retry} />
          ) : !tasks.data || !season.settled ? (
            <LoadingState />
          ) : (
            <EmptyState title={t('tasks.emptyTitle')} body={t('tasks.emptyBody')} />
          )}
        </section>

        <section aria-labelledby="guide-heading">
          {guide.isError ? (
            <ErrorState error={guide.error} onRetry={() => void guide.refetch()} />
          ) : guide.data ? (
            <div className="bg-primary-gradient relative overflow-hidden rounded-xl p-4 text-on-primary">
              <Icon name="eco" className="absolute -bottom-4 -right-4 text-[72px] opacity-20" />
              <p className="font-label text-xs font-bold uppercase tracking-widest text-primary-fixed-dim">{t('dashboard.season', { season: guide.data.season })}</p>
              <h2 id="guide-heading" className="mt-2 font-headline text-lg">{guide.data.advice}</h2>
              {guide.data.crops.length > 0 && (
                <Link to="/crops" className="mt-2 block font-body text-sm text-primary-fixed-dim underline-offset-2 hover:underline">
                  {t('dashboard.sowNowLink', { crops: guide.data.crops.join(', ') })}
                </Link>
              )}
            </div>
          ) : (
            <LoadingState />
          )}
        </section>

        <section aria-label={t('dashboard.garden')} className="space-y-2 rounded-xl bg-surface-container-low p-3">
          <h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('dashboard.garden')}</h2>
          <div className="grid grid-cols-3 gap-2">
            <GardenCount count={trees} label={t('dashboard.trees', { count: trees ?? 0 })} to="/plants?group=trees" addLabel={t('dashboard.addTrees')} onAdd={() => setAdding(true)} />
            <div className="space-y-1">
              <GardenCount count={crops} label={t('dashboard.crops', { count: crops ?? 0 })} to="/plants?group=crops" addLabel={t('dashboard.addCrops')} onAdd={() => setAdding(true)} planned={planned} />
              {planned > 0 && (
                <Link to="/plants?group=crops&tab=planned" className="block text-center font-label text-[11px] font-semibold text-secondary">
                  {t('dashboard.planned', { count: planned })}
                </Link>
              )}
            </div>
            <button type="button" onClick={() => setAdding(true)} className="flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-primary">
              <span className="bg-primary-gradient flex h-11 w-11 items-center justify-center rounded-full text-on-primary">
                <Icon name="add" />
              </span>
              <span className="font-label text-[11px] font-semibold leading-tight">{t('crops.chooser.open')}</span>
            </button>
          </div>
        </section>
      </main>
      {adding && <AddToGardenSheet onClose={() => setAdding(false)} />}
    </Screen>
  );
}

/** A pebble with a count that opens its group on the Plants tab, or a faint "+ Add" when the group is empty. */
function GardenCount({ count, label, to, addLabel, onAdd, planned = 0 }: { count: number | null; label: string; to: string; addLabel: string; onAdd: () => void; planned?: number }) {
  if (count === 0 && planned === 0) {
    return (
      <button type="button" onClick={onAdd} className="flex w-full flex-col items-center gap-1 rounded-xl p-2 text-primary/60">
        <Pebble className="flex h-11 w-11 items-center justify-center opacity-60">
          <Icon name="add" />
        </Pebble>
        <span className="font-label text-[11px] font-semibold leading-tight">{addLabel}</span>
      </button>
    );
  }
  return (
    <Link to={to} className="flex flex-col items-center gap-1 rounded-xl p-2">
      <Pebble className="flex h-11 w-11 items-center justify-center">
        <span className="font-display text-lg text-primary">{count ?? '–'}</span>
      </Pebble>
      <span className="text-center font-label text-[11px] font-semibold leading-tight text-on-surface-variant">{label}</span>
    </Link>
  );
}
