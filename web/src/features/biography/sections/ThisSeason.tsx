import { useTranslation } from 'react-i18next';
import { ErrorState, Icon, LoadingState, Surface } from '../../../ui';
import { usePlantIntelligence } from '../../seasonal';

/** What to avoid and watch for. "Do now" is gone: those same templates become the tasks below. */
export function ThisSeason({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const intel = usePlantIntelligence(plantId);
  const pack = intel.data?.seasonal_pack;
  if (intel.isError) return <ErrorState error={intel.error} onRetry={() => void intel.refetch()} />;
  if (!pack) return <LoadingState />;
  const note = intel.data?.care_note ?? null;
  if (pack.avoid_now.length === 0 && pack.watch_for.length === 0 && !note) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-headline text-xl text-primary">{t('biography.thisSeason')}</h2>
      {note && <p className="font-body text-sm text-on-surface-variant">{note}</p>}
      <AdviceList title={t('biography.avoid')} icon="block" items={pack.avoid_now} />
      <AdviceList title={t('biography.watchFor')} icon="visibility" items={pack.watch_for} />
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
