import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import orchardPhoto from '../../assets/stitch/dashboard-orchard.jpg';
import { systemClock } from '../../lib/clock';
import { EmptyState, ErrorState, Icon, LoadingState, Pebble, Screen } from '../../ui';
import { useSession } from '../auth';
import { useCropSyncOnce } from '../crops';
import { useAllPlants } from '../plants';
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

        <section className="grid grid-cols-2 gap-3" aria-label={t('dashboard.garden')}>
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
            <Pebble className="h-11 w-11 shrink-0">
              <span className="font-display text-lg text-primary">{plants.data?.length ?? '–'}</span>
            </Pebble>
            <p className="font-headline text-sm leading-tight text-on-surface-variant">{t('dashboard.plantsInGarden')}</p>
          </div>
          <Link to="/plants/new" className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 text-primary">
            <span className="bg-primary-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-primary">
              <Icon name="add" />
            </span>
            <span className="font-headline text-sm leading-tight">{t('dashboard.addTree')}</span>
          </Link>
        </section>
      </main>
    </Screen>
  );
}
