import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { messageFor } from '../../../lib/error-messages';
import { Button, Icon } from '../../../ui';
import { plantName, type PlantDetail } from '../../plants';
import { usePlantRestore } from '../usePlantRestore';
import { monthYear } from './format';

/** A calm note at the top of an ended plant's page, with Restore (and, for a tree, Plant a replacement). */
export function EndedBanner({ plant, crop = false }: { plant: PlantDetail; crop?: boolean }) {
  const { t, i18n } = useTranslation();
  const restore = usePlantRestore(plant.id);
  if (!plant.ended_at) return null;
  const reason = plant.end_reason ?? 'UNKNOWN_CAUSE';
  const verb =
    crop && reason === 'REMOVED' ? t('biography.end.pulledOut') : t(`biography.end.verb.${reason === 'REMOVED' || reason === 'REPLACED' ? reason : 'died'}`);
  const date = monthYear(plant.ended_at, i18n.language);
  const line =
    reason === 'REMOVED' || reason === 'REPLACED'
      ? t('biography.end.bannerShort', { verb, date })
      : t('biography.end.banner', { verb, date, reason: t(`biography.end.reason.${reason}`) });
  return (
    <section className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <p className="flex items-center gap-2 font-headline text-lg text-primary">
        <Icon name="spa" className="text-outline" />
        {line}
      </p>
      {plant.end_note && <p className="font-body text-sm text-on-surface-variant">{plant.end_note}</p>}
      {plant.replaced_by && (
        <Link to={`/plants/${plant.replaced_by.id}`} className="inline-flex min-h-11 items-center font-label text-sm font-bold text-secondary">
          {t('biography.end.replacedBy', { name: plantName(plant.replaced_by) })}
        </Link>
      )}
      {restore.error !== null && (
        <p role="alert" className="font-body text-sm text-error">
          {messageFor(restore.error, t)}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {/* A crop's next season starts from the crop calendar, not the tree form. */}
        {!plant.replaced_by && !crop && (
          <Link to={`/plants/new?replaces=${plant.id}`} className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-5 font-label text-sm font-bold text-on-primary">
            {t('biography.end.replace')}
          </Link>
        )}
        <Button variant="tertiary" busy={restore.busy} onClick={restore.restore}>
          {t('biography.end.restore')}
        </Button>
      </div>
    </section>
  );
}
