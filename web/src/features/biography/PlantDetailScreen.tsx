import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { systemClock } from '../../lib/clock';
import { Button, ErrorState, Icon, LoadingState, NotInGarden, Screen, isPlantMissing } from '../../ui';
import { CropHero, JourneyCard } from '../crops';
import { useTimeline } from '../journal';
import { usePlant, type PlantDetail } from '../plants';
import { healthLabel } from './health-label';
import { AtAGlance } from './sections/AtAGlance';
import { EndedBanner } from './sections/EndedBanner';
import { EndSheet } from './sections/EndSheet';
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
  const ended = Boolean(plant.ended_at);
  const crop = Boolean(plant.crop_id);
  const [ending, setEnding] = useState(false);

  return (
    <Screen className="pb-28">
      <BackButton />
      {crop && !ended ? <CropHero plant={plant} now={now} /> : <Hero plant={plant} health={health} photoKey={heroKey} now={now} />}
      <main className="space-y-7 px-4">
        {plant.replaces.map((old) => (
          <Link key={old.id} to={`/plants/${old.id}`} className="inline-flex min-h-11 items-center gap-1 font-label text-sm font-bold text-secondary">
            <Icon name="history" className="text-base" />
            {t('biography.end.replaces', { name: old.name })}
          </Link>
        ))}
        {ended ? (
          // An ended tree is a record: its history stays, the growing work goes.
          <EndedBanner plant={plant} />
        ) : crop ? (
          // A calendar crop follows its journey, not the tree sections.
          <>
            <JourneyCard plant={plant} />
            <UpcomingCare plantId={plant.id} now={now} />
          </>
        ) : (
          <>
            <MemoryCard plant={plant} now={now} />
            <AtAGlance plant={plant} />
            <ThisSeason plantId={plant.id} />
            <UpcomingCare plantId={plant.id} now={now} />
          </>
        )}
        <YearOnYear plantId={plant.id} now={now} crop={crop} />
        {!crop && <Milestones plant={plant} />}
        <SanctuaryRecord plantId={plant.id} />
        {!ended &&
          (ending ? (
            <EndSheet plantId={plant.id} entries={entries} now={now} crop={crop} onClose={() => setEnding(false)} />
          ) : (
            <div className="flex justify-center">
              <Button variant="quiet" onClick={() => setEnding(true)}>
                {t(crop ? 'biography.end.openCrop' : 'biography.end.open')}
              </Button>
            </div>
          ))}
      </main>
      {!ended && (
        <Link
          to={`/plants/${plant.id}/log`}
          className="bg-primary-gradient fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-on-primary shadow-[0_8px_40px_rgba(23,49,36,0.2)] transition-transform hover:scale-95"
        >
          <Icon name="add_a_photo" filled />
          <span className="font-label font-bold tracking-wide">{t('biography.logMoment')}</span>
        </Link>
      )}
    </Screen>
  );
}
