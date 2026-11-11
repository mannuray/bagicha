import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import orchardPhoto from '../../assets/stitch/dashboard-orchard.jpg';
import { EmptyState, ErrorState, Icon, LoadingState, Pebble, Screen, SeeAllLink } from '../../ui';
import { AddToGardenSheet } from '../crops';
import { TaskGroups } from '../tasks';
import { useDashboard } from './useDashboard';

const PREVIEW = 5;

/** Stitch "Home Dashboard – Sanctuary", with its orchard photo. The weather card is hidden until weather is real. */
export function DashboardScreen() {
  const { t } = useTranslation();
  const { user, now, greeting, plants, season, counts, planned, tasks, week, guide, adding, setAdding } = useDashboard();
  const trees = counts?.tree ?? null;
  const crops = counts?.crop ?? null;
  const flowers = counts?.flowers ?? null;

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
          <div className="flex items-center justify-between px-2">
            <h2 id="week-heading" className="font-label text-sm font-bold uppercase tracking-widest text-outline">
              {t('dashboard.thisWeek')}
            </h2>
            <SeeAllLink to="/tasks" />
          </div>
          {week.kind === 'error' && week.source === 'tasks' ? (
            <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
          ) : week.kind === 'tasks' && tasks.data ? (
            <TaskGroups tasks={tasks.data.items} now={now} limit={PREVIEW} />
          ) : week.kind === 'error' && week.source === 'plants' ? (
            <ErrorState error={plants.error} onRetry={() => void plants.refetch()} />
          ) : week.kind === 'error' ? (
            <ErrorState error={season.error} onRetry={season.retry} />
          ) : week.kind === 'loading' ? (
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
              {guide.data.points.length > 0 && (
                <ul aria-label={t('dashboard.thisMonth')} className="mt-2 space-y-1">
                  {guide.data.points.map((point) => (
                    <li key={point} className="flex gap-2 font-body text-sm text-on-primary/90">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary-fixed-dim" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
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
            <GardenCount count={trees} label={t('dashboard.trees', { count: trees ?? 0 })} to="/plants?group=trees" />
            <div className="space-y-1">
              <GardenCount count={crops} label={t('dashboard.crops', { count: crops ?? 0 })} to="/plants?group=crops" />
              {planned > 0 && (
                <Link to="/plants?group=crops&tab=planned" className="block text-center font-label text-[11px] font-semibold text-secondary">
                  {t('dashboard.planned', { count: planned })}
                </Link>
              )}
            </div>
            <div className="space-y-1">
              <GardenCount count={flowers} label={t('dashboard.flowers', { count: flowers ?? 0 })} to="/plants?group=flowers" />
              {(flowers ?? 0) > 0 && (
                <p className="text-center font-label text-[11px] font-semibold text-secondary">
                  {t('dashboard.flowerSplit', { seasonal: counts?.seasonalFlower ?? 0, perennial: counts?.perennialFlower ?? 0 })}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={() => setAdding(true)} className="flex items-center justify-center gap-2 rounded-full p-1 pr-3 text-primary">
              <span className="bg-primary-gradient flex h-9 w-9 items-center justify-center rounded-full text-on-primary">
                <Icon name="add" />
              </span>
              <span className="font-label text-sm font-semibold">{t('crops.chooser.open')}</span>
            </button>
          </div>
        </section>
      </main>
      {adding && <AddToGardenSheet onClose={() => setAdding(false)} />}
    </Screen>
  );
}

/** A pebble with a count that opens its group on the Plants tab (0 included: one add button serves the garden). */
function GardenCount({ count, label, to }: { count: number | null; label: string; to: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1 rounded-xl p-2">
      <Pebble className="flex h-11 w-11 items-center justify-center">
        <span className="font-display text-lg text-primary">{count ?? '–'}</span>
      </Pebble>
      <span className="text-center font-label text-[11px] font-semibold leading-tight text-on-surface-variant">{label}</span>
    </Link>
  );
}
