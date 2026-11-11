import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '../../ui';

/** A plant that is not (or no longer) in your garden, with the way back to My plants. */
export function NotInGarden() {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-xl bg-surface-container-low px-6 py-10 text-center">
      <span className="pebble-large flex h-16 w-16 items-center justify-center bg-surface-container-lowest text-secondary">
        <Icon name="search_off" />
      </span>
      <p className="font-headline text-xl text-primary">{t('errors.PLANT_NOT_FOUND')}</p>
      <Link to="/plants" className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-6 font-label text-sm font-bold text-on-primary">
        {t('plants.backToPlants')}
      </Link>
    </div>
  );
}
