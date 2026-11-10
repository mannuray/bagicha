import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { systemClock } from '../../lib/clock';
import { ErrorState, Icon, LoadingState, NotInGarden, Screen, isPlantMissing } from '../../ui';
import { useTimeline } from '../journal';
import { usePlant, type PlantDetail } from '../plants';
import { healthLabel } from './health-label';
import { AtAGlance } from './sections/AtAGlance';
import { photoKeyOf } from './sections/format';
import { Hero } from './sections/Hero';
import { MemoryCard } from './sections/MemoryCard';
import { Milestones } from './sections/Milestones';
import { SanctuaryRecord } from './sections/SanctuaryRecord';
import { ThisSeason } from './sections/ThisSeason';
import { UpcomingCare } from './sections/UpcomingCare';
import { YearOnYear } from './sections/YearOnYear';

/** Stitch "The Botanical Record" for one tree (route component). */
export function PlantDetailScreen() {
  const { id = '' } = useParams();
  const plant = usePlant(id);

  if (plant.isError) {
    return (
      <Screen>
        <BackButton />
        <div className="p-4 pt-24">
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
      className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 text-primary shadow-[0_4px_20px_rgba(28,28,25,0.08)] backdrop-blur-xl"
    >
      <Icon name="arrow_back" />
    </Link>
  );
}

/**
 * The tree page, ordered by what an owner asks (spec: tree-page-v2): how is it, what to do now,
 * was this year better than last, its milestones and its record.
 */
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
      <Hero plant={plant} health={health} photoKey={heroKey} now={now} />
      <main className="space-y-7 px-4">
        <MemoryCard plant={plant} now={now} />
        <AtAGlance plant={plant} />
        <ThisSeason plantId={plant.id} />
        <UpcomingCare plantId={plant.id} now={now} />
        <YearOnYear plantId={plant.id} now={now} />
        <Milestones plant={plant} />
        <SanctuaryRecord plantId={plant.id} />
      </main>
      <Link
        to={`/plants/${plant.id}/log`}
        className="bg-primary-gradient fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-on-primary shadow-[0_8px_40px_rgba(23,49,36,0.2)] transition-transform hover:scale-95"
      >
        <Icon name="add_a_photo" filled />
        <span className="font-label font-bold tracking-wide">{t('biography.logMoment')}</span>
      </Link>
    </Screen>
  );
}
