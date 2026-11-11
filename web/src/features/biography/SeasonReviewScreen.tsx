import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { EmptyState, ErrorState, Icon, LoadingState, Screen, Surface, TopBar } from '../../ui';
import { isPlantMissing, type MitigationPlan, NotInGarden, useCycles, useMitigationPlan } from '../plants';

/** "Learn for next season": the mitigation plan for the latest cycle. */
export function SeasonReviewScreen() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const plan = useMitigationPlan(id);

  return (
    <Screen>
      <TopBar title={t('review.bar')} />
      <main className="space-y-4 px-4 pb-10 pt-4">
        {plan.isError ? (
          isPlantMissing(plan.error) ? <NotInGarden /> : <ErrorState error={plan.error} onRetry={() => void plan.refetch()} />
        ) : !plan.data ? (
          <LoadingState />
        ) : plan.data.cycle_year === null ? (
          <EmptyState title={t('review.emptyTitle')} body={t('review.emptyBody')} />
        ) : (
          <Review plantId={id} plan={plan.data} />
        )}
      </main>
    </Screen>
  );
}

function Review({ plantId, plan }: { plantId: string; plan: MitigationPlan }) {
  const { t } = useTranslation();
  const cycles = useCycles(plantId);
  return (
    <>
      <header>
        <h1 className="font-headline text-2xl text-primary">{t('review.title', { year: plan.cycle_year })}</h1>
        <p className="mt-3 font-body text-base leading-relaxed text-on-surface-variant">{plan.summary}</p>
      </header>
      <Card icon="report" title={t('review.likely')} items={plan.likely_issues} />
      <Card icon="swap_horiz" title={t('review.change')} items={plan.what_to_change} />
      <Card icon="visibility" title={t('review.watch')} items={plan.watch_early} />
      <Card icon="bolt" title={t('review.first')} items={plan.priority_actions} />
      <Surface className="grid grid-cols-3 gap-2 p-4 text-center">
        <Stat value={plan.completed_tasks} label={t('review.done', { count: plan.completed_tasks })} />
        <Stat value={plan.skipped_tasks} label={t('review.skipped')} />
        <Stat value={plan.pending_tasks} label={t('review.pending')} />
      </Surface>
      {cycles.data && cycles.data.items.length > 1 && (
        <Surface className="p-4">
          <p className="mb-2 font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('review.compare')}</p>
          {cycles.data.items.map((c) => (
            <p key={c.id} className="font-body text-sm text-on-surface">
              <span className="font-bold">{c.cycle_year}: </span>
              {c.cycle_summary}
            </p>
          ))}
        </Surface>
      )}
    </>
  );
}

function Card({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Surface shape="pebble" className="p-4">
      <p className="mb-3 flex items-center gap-2 font-label text-xs font-bold uppercase tracking-widest text-secondary">
        <Icon name={icon} filled />
        {title}
      </p>
      <ul className="space-y-2 font-body text-sm text-on-surface">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Surface>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl text-primary">{value}</p>
      <p className="font-label text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
    </div>
  );
}
