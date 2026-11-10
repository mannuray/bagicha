import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { systemClock } from '../../lib/clock';
import { EmptyState, ErrorState, Icon, LoadingState, Pebble, Screen } from '../../ui';
import { useSession } from '../auth';
import { usePlants } from '../plants';
import { useSeasonalGuide } from '../seasonal';
import { hasPendingSoon, TaskGroups, useMyTasks } from '../tasks';
import { useSessionMaterialize } from './use-session-materialize';

const PREVIEW = 5;

/** Stitch "Home Dashboard – Sanctuary". The weather card is hidden until weather is real. */
export function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useSession();
  const plants = usePlants(1);
  const settled = useSessionMaterialize(plants.data?.items.map((p) => p.id));
  const tasks = useMyTasks();
  const guide = useSeasonalGuide();
  const now = systemClock.now();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <Screen nav>
      <header className="bg-primary-gradient relative overflow-hidden rounded-b-xl px-6 pb-14 pt-12 text-on-primary shadow-[0_10px_40px_rgba(28,28,25,0.06)]">
        <div className="pebble-large absolute -right-16 -top-10 h-56 w-56 bg-primary-fixed-dim/10" aria-hidden />
        <p className="relative font-label text-sm uppercase tracking-widest text-primary-fixed-dim">
          {[user?.district, guide.data?.season].filter(Boolean).join(' • ')}
        </p>
        <h1 className="relative mt-2 font-display text-4xl leading-tight tracking-tight">
          {t(`dashboard.greeting.${greeting}`)}
          <br />
          {user?.name ?? t('profile.noName')}
        </h1>
      </header>

      <main className="relative z-10 -mt-6 space-y-8 px-6">
        <section aria-labelledby="week-heading" className="space-y-3">
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
          ) : !tasks.data || (!settled && !hasPendingSoon(tasks.data.items, now)) ? (
            <LoadingState />
          ) : hasPendingSoon(tasks.data.items, now) ? (
            <TaskGroups tasks={tasks.data.items} now={now} limit={PREVIEW} />
          ) : (
            <EmptyState title={t('tasks.emptyTitle')} body={t('tasks.emptyBody')} />
          )}
        </section>

        <section aria-labelledby="guide-heading">
          {guide.isError ? (
            <ErrorState error={guide.error} onRetry={() => void guide.refetch()} />
          ) : guide.data ? (
            <div className="bg-primary-gradient relative overflow-hidden rounded-xl p-6 text-on-primary">
              <Icon name="eco" className="absolute -bottom-4 -right-4 text-[100px] opacity-20" />
              <p className="font-label text-xs font-bold uppercase tracking-widest text-primary-fixed-dim">{t('dashboard.season', { season: guide.data.season })}</p>
              <h2 id="guide-heading" className="mt-2 font-headline text-xl">{guide.data.advice}</h2>
              {guide.data.crops.length > 0 && (
                <p className="mt-3 font-body text-sm text-primary-fixed-dim">{t('dashboard.sowNow', { crops: guide.data.crops.join(', ') })}</p>
              )}
            </div>
          ) : (
            <LoadingState />
          )}
        </section>

        <section className="grid grid-cols-2 gap-4" aria-label={t('dashboard.garden')}>
          <div className="relative flex h-48 flex-col items-center justify-between rounded-xl bg-surface-container-low p-5 text-center">
            <Pebble className="h-24 w-24">
              <span className="font-display text-4xl text-primary">{plants.data?.pagination.total_items ?? '–'}</span>
            </Pebble>
            <p className="font-headline text-lg text-on-surface-variant">{t('dashboard.plantsInGarden')}</p>
          </div>
          <Link to="/plants/new" className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl bg-surface-container-low p-5 text-center text-primary">
            <span className="bg-primary-gradient flex h-14 w-14 items-center justify-center rounded-full text-on-primary">
              <Icon name="add" />
            </span>
            <span className="font-headline text-lg">{t('dashboard.addTree')}</span>
          </Link>
        </section>
      </main>
    </Screen>
  );
}
