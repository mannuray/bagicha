import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { systemClock } from '../../lib/clock';
import { ErrorState, Icon, LoadingState, NotInGarden, Screen, Surface, cx, isPlantMissing } from '../../ui';
import { useMediaUrl, useTimeline, type JournalEntry } from '../journal';
import { useCycles, usePlant, useSeasonalState, type Cycle, type PlantDetail } from '../plants';
import { TaskCard, thisWeek, usePlantTasks } from '../tasks';
import { growthRing, RING_COUNT } from './growth-stage';
import { healthLabel } from './health-label';

/** Stitch "Tree Biography – Detailed Record", extended with the loop: this season, care, cycles, review. */
export function PlantDetailScreen() {
  const { id = '' } = useParams();
  const plant = usePlant(id);

  if (plant.isError) {
    return (
      <Screen>
        <BackButton />
        <div className="p-6 pt-24">
          {isPlantMissing(plant.error) ? <NotInGarden /> : <ErrorState error={plant.error} onRetry={() => void plant.refetch()} />}
        </div>
      </Screen>
    );
  }
  if (!plant.data) return <Screen><LoadingState /></Screen>;
  return <Biography plant={plant.data} />;
}

function BackButton() {
  const { t } = useTranslation();
  return (
    <Link
      to="/plants"
      aria-label={t('common.back')}
      className="fixed left-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-surface/80 text-primary shadow-[0_4px_20px_rgba(28,28,25,0.08)] backdrop-blur-xl"
    >
      <Icon name="arrow_back" />
    </Link>
  );
}

function Biography({ plant }: { plant: PlantDetail }) {
  const { t } = useTranslation();
  const timeline = useTimeline(plant.id);
  const entries = timeline.data?.items ?? [];
  const now = systemClock.now();
  const health = healthLabel(plant, entries, now);
  const heroKey = entries.map((e) => photoKeyOf(e)).find(Boolean) ?? null;

  return (
    <Screen className="pb-28">
      <BackButton />
      <Hero plant={plant} health={health} photoKey={heroKey} />
      <main className="space-y-12 px-6">
        <Essence plant={plant} />
        <GrowthRings stage={plant.lifecycle_stage} />
        <ThisSeason plantId={plant.id} />
        <UpcomingCare plantId={plant.id} now={now} />
        <Timeline query={timeline} />
        <Cycles plantId={plant.id} />
        <Link
          to={`/plants/${plant.id}/season`}
          className="flex min-h-14 items-center justify-between rounded-xl bg-surface-container-low px-6 py-4 text-primary"
        >
          <span className="font-headline text-lg">{t('biography.seasonReview')}</span>
          <Icon name="arrow_forward" />
        </Link>
      </main>
      <Link
        to={`/plants/${plant.id}/log`}
        className="bg-primary-gradient fixed bottom-8 right-6 z-50 flex items-center gap-3 rounded-full px-6 py-4 text-on-primary shadow-[0_8px_40px_rgba(23,49,36,0.2)] transition-transform hover:scale-95"
      >
        <Icon name="add_a_photo" filled />
        <span className="font-label font-bold tracking-wide">{t('biography.logMoment')}</span>
      </Link>
    </Screen>
  );
}

const photoKeyOf = (e: JournalEntry) => {
  const key = e.metadata?.photo_key;
  return typeof key === 'string' ? key : null;
};

function Hero({ plant, health, photoKey }: { plant: PlantDetail; health: ReturnType<typeof healthLabel>; photoKey: string | null }) {
  const { t } = useTranslation();
  const photo = useMediaUrl(photoKey);
  return (
    <header className="relative mb-8 h-[420px] w-full overflow-hidden rounded-b-[40px] bg-primary-gradient">
      {photo.data && <img src={photo.data} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-10 left-8 right-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 font-label text-sm font-bold uppercase tracking-[0.15em] text-secondary-container">
            {[plant.species, plant.variety].filter(Boolean).join(' · ')}
          </p>
          <h1 className="font-headline text-5xl font-bold leading-none text-on-primary">{plant.name}</h1>
        </div>
        <div
          className={cx(
            'glass-panel pebble-large flex min-w-[96px] flex-col items-center justify-center p-4 text-center text-on-primary shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
            health.tone === 'attention' && 'bg-secondary/70',
          )}
        >
          <Icon name={health.tone === 'attention' ? 'warning' : 'favorite'} filled />
          <span className="mt-1 font-label text-[11px] font-bold uppercase tracking-wider">
            {health.label ?? t('biography.needsAttention')}
          </span>
        </div>
      </div>
    </header>
  );
}

function Essence({ plant }: { plant: PlantDetail }) {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="mb-6 font-headline text-2xl text-primary">{t('biography.essence')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <Surface shape="pebble" className="col-span-2 flex min-h-[110px] flex-col items-start justify-center p-6">
          <p className="mb-1 font-label text-xs uppercase tracking-widest text-on-surface-variant">{t('biography.family')}</p>
          <p className="font-headline text-xl capitalize text-primary">{plant.species_family ?? plant.species}</p>
        </Surface>
        <Surface shape="pebbleSmall" className="flex min-h-[100px] flex-col justify-center p-5">
          <p className="mb-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{t('biography.habit')}</p>
          <p className="font-headline text-lg capitalize text-primary">{plant.growth_habit.toLowerCase()}</p>
        </Surface>
        <Surface shape="pebbleSmall" className="flex min-h-[100px] flex-col justify-center p-5">
          <p className="mb-1 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{t('biography.journal')}</p>
          <p className="font-headline text-lg text-primary">{t('biography.entries', { count: plant._count.journal_entries })}</p>
        </Surface>
      </div>
    </section>
  );
}

function GrowthRings({ stage }: { stage: string }) {
  const { t } = useTranslation();
  const lit = growthRing(stage);
  return (
    <section className="flex flex-col items-center py-4" aria-label={t('biography.stage')}>
      <div className="relative flex h-60 w-60 items-center justify-center">
        {Array.from({ length: RING_COUNT }, (_, i) => (
          <div
            key={i}
            className={cx('pebble-large absolute', i <= lit ? 'border-primary' : 'border-surface-container-high')}
            style={{ inset: `${(RING_COUNT - 1 - i) * 22}px`, borderWidth: i === lit ? 4 : 2, borderStyle: 'solid' }}
            aria-hidden
          />
        ))}
        <div className="bg-primary-gradient pebble-large z-10 flex h-16 w-16 items-center justify-center text-on-primary">
          <Icon name="eco" filled className="text-2xl" />
        </div>
      </div>
      <p className="mt-4 rounded-full bg-surface-container-lowest px-4 py-1 font-label text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
        {t(`plants.stage.${stage}`)}
      </p>
    </section>
  );
}

function ThisSeason({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const state = useSeasonalState(plantId);
  return (
    <section>
      <h2 className="mb-6 font-headline text-2xl text-primary">{t('biography.thisSeason')}</h2>
      {state.isError ? (
        <ErrorState error={state.error} onRetry={() => void state.refetch()} />
      ) : !state.data ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          <p className="font-body text-base text-on-surface-variant">
            {t('biography.phase', { current: humanize(state.data.current_phase), next: humanize(state.data.upcoming_phase) })}
          </p>
          <AdviceList title={t('biography.doNow')} icon="check_circle" items={state.data.do_now} />
          <AdviceList title={t('biography.avoid')} icon="block" items={state.data.avoid_now} />
          <AdviceList title={t('biography.watchFor')} icon="visibility" items={state.data.watch_for} />
        </div>
      )}
    </section>
  );
}

const humanize = (phase: string) => phase.replace(/_/g, ' ');

function AdviceList({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Surface className="p-5">
      <p className="mb-2 flex items-center gap-2 font-label text-xs font-bold uppercase tracking-widest text-secondary">
        <Icon name={icon} filled />
        {title}
      </p>
      <ul className="space-y-1 font-body text-sm text-on-surface">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Surface>
  );
}

function UpcomingCare({ plantId, now }: { plantId: string; now: Date }) {
  const { t } = useTranslation();
  const tasks = usePlantTasks(plantId);
  const upcoming = tasks.data ? (() => { const g = thisWeek(tasks.data.items, now); return [...g.overdue, ...g.week, ...g.later].slice(0, 3); })() : [];
  return (
    <section>
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-headline text-2xl text-primary">{t('biography.upcomingCare')}</h2>
        <Link to={`/plants/${plantId}/tasks`} className="font-label text-sm font-bold text-secondary">
          {t('common.seeAll')}
        </Link>
      </div>
      {tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : !tasks.data ? (
        <LoadingState />
      ) : upcoming.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant">{t('tasks.emptyPlantBody')}</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((task) => (
            <TaskCard key={task.id} task={task} now={now} showPlant={false} />
          ))}
        </div>
      )}
    </section>
  );
}

function Timeline({ query }: { query: ReturnType<typeof useTimeline> }) {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="mb-8 pl-4 font-headline text-2xl text-primary">{t('biography.path')}</h2>
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : !query.data ? (
        <LoadingState />
      ) : query.data.items.length === 0 ? (
        <p className="pl-4 font-body text-sm text-on-surface-variant">{t('biography.noEntries')}</p>
      ) : (
        <ol className="relative pl-8">
          <div className="absolute bottom-0 left-4 top-0 w-0.5 rounded-full bg-gradient-to-b from-secondary to-primary-container opacity-30" aria-hidden />
          {query.data.items.map((entry) => (
            <TimelineEntry key={entry.id} entry={entry} />
          ))}
        </ol>
      )}
    </section>
  );
}

function TimelineEntry({ entry }: { entry: JournalEntry }) {
  const { t, i18n } = useTranslation();
  const photo = useMediaUrl(photoKeyOf(entry));
  const date = new Date(entry.timestamp).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <li className="relative mb-8">
      <span className="absolute -left-5 top-4 h-2.5 w-2.5 rounded-full bg-secondary" aria-hidden />
      <p className="mb-3 ml-4 font-label text-xs font-bold uppercase tracking-widest text-secondary">{date}</p>
      <div className="flex items-center gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-[0_4px_30px_rgba(28,28,25,0.03)]">
        {photo.data && (
          <div className="pebble-large h-20 w-20 shrink-0 overflow-hidden">
            <img src={photo.data} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="mb-1 font-headline text-lg font-bold text-primary">{t(`journal.types.${entry.type}`, { defaultValue: humanize(entry.type) })}</h3>
          {entry.content && <p className="line-clamp-3 font-body text-sm text-on-surface-variant">{entry.content}</p>}
        </div>
      </div>
    </li>
  );
}

function Cycles({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const cycles = useCycles(plantId);
  return (
    <section>
      <h2 className="mb-6 font-headline text-2xl text-primary">{t('biography.cycles')}</h2>
      {cycles.isError ? (
        <ErrorState error={cycles.error} onRetry={() => void cycles.refetch()} />
      ) : !cycles.data ? (
        <LoadingState />
      ) : cycles.data.items.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant">{t('biography.noCycles')}</p>
      ) : (
        <div className="space-y-3">
          {cycles.data.items.map((cycle) => (
            <CycleCard key={cycle.id} cycle={cycle} />
          ))}
        </div>
      )}
    </section>
  );
}

function CycleCard({ cycle }: { cycle: Cycle }) {
  const { t } = useTranslation();
  return (
    <Surface className="p-5">
      <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('biography.cycleYear', { year: cycle.cycle_year })}</p>
      {cycle.cycle_summary && <p className="mt-2 font-body text-sm text-on-surface">{cycle.cycle_summary}</p>}
      {cycle.yield_quantity !== null && (
        <p className="mt-2 font-headline text-lg text-primary">
          {cycle.yield_quantity} {cycle.yield_unit ?? ''}
        </p>
      )}
    </Surface>
  );
}
