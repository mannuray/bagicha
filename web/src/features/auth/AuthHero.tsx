import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui';

/** Stitch login hero, with the stock photo replaced by the forest gradient. */
export function AuthHero() {
  const { t } = useTranslation();
  return (
    <header className="bg-primary-gradient relative flex h-[300px] w-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pebble-large absolute -right-12 -top-12 h-48 w-48 bg-primary-fixed-dim/10" aria-hidden />
      <div className="pebble-small absolute -bottom-16 -left-10 h-56 w-56 bg-secondary/20" aria-hidden />
      <div className="relative mb-4 rounded-full bg-surface/30 p-4 backdrop-blur-md">
        <Icon name="spa" className="text-4xl text-surface" />
      </div>
      <p className="relative font-headline text-4xl font-semibold italic tracking-tight text-on-primary">{t('app.name')}</p>
    </header>
  );
}
