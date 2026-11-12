import { useTranslation } from 'react-i18next';
import { ErrorState, Icon, LoadingState, Surface } from '../../../ui';
import { usePlantIntelligence, type PlantIntelligence } from '../../seasonal';

/** What to avoid and watch for. "Do now" is gone: those same templates become the tasks below. */
export function ThisSeason({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const intel = usePlantIntelligence(plantId);
  const pack = intel.data?.seasonal_pack;
  if (intel.isError) return <ErrorState error={intel.error} onRetry={() => void intel.refetch()} />;
  if (!pack) return <LoadingState />;
  const note = intel.data?.care_note ?? null;
  const month = intel.data?.care_this_month ?? [];
  if (pack.avoid_now.length === 0 && pack.watch_for.length === 0 && !note && month.length === 0) return null;
  return (
    <section className="space-y-3">
      {month.length > 0 && <ThisMonth items={month} />}
      <h2 className="font-headline text-xl text-primary">{t('biography.thisSeason')}</h2>
      {note && <p className="font-body text-sm text-on-surface-variant">{note}</p>}
      <AdviceList title={t('biography.avoid')} icon="block" items={pack.avoid_now} />
      <AdviceList title={t('biography.watchFor')} icon="visibility" items={pack.watch_for} />
    </section>
  );
}

type CareLine = NonNullable<PlantIntelligence['care_this_month']>[number];

/** This month's care: what to do, the organic way first, the dose for this tree, the alternative and why. */
function ThisMonth({ items }: { items: CareLine[] }) {
  const { t } = useTranslation();
  return (
    <section aria-label={t('biography.thisMonth')} className="space-y-2">
      <h3 className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('biography.thisMonth')}</h3>
      {items.map((item) => (
        <Surface key={item.title} className="space-y-1 p-4 font-body text-sm text-on-surface">
          <p className="font-bold text-primary">{item.title}</p>
          {item.if_you_see && (
            <p className="text-on-surface-variant">
              {t('biography.ifYouSee')} {item.if_you_see}
            </p>
          )}
          {item.organic && (
            <p>
              <span className="font-label text-xs font-bold uppercase tracking-wider text-primary">{t('tasks.care.organic')}</span> {item.organic}
            </p>
          )}
          {item.amount && <p className="text-on-surface-variant">{item.amount}</p>}
          {item.chemical && (
            <p>
              <span className="font-label text-xs font-bold uppercase tracking-wider text-secondary">{t('tasks.care.alternative')}</span> {item.chemical}
            </p>
          )}
          <p className="text-xs italic text-on-surface-variant">{item.why}</p>
        </Surface>
      ))}
    </section>
  );
}

function AdviceList({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Surface className="p-4">
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
