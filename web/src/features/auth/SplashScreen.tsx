import { useTranslation } from 'react-i18next';
import { BagichaLogo } from '../../ui';
import { useSplashRedirect } from './useSplashRedirect';

/** Stitch "Natural Sanctuary" splash: brand moment, then on to the right place. */
export function SplashScreen() {
  const { t } = useTranslation();
  useSplashRedirect();

  return (
    <div className="bg-primary-gradient relative flex min-h-dvh flex-col items-center justify-center overflow-hidden text-on-primary">
      <div className="pebble-large absolute -left-20 top-16 h-72 w-72 bg-primary-fixed-dim/10" aria-hidden />
      <div className="pebble-small absolute -bottom-24 -right-16 h-80 w-80 bg-secondary/20" aria-hidden />
      <BagichaLogo size={72} className="relative mb-3 drop-shadow-xl" />
      <h1 className="relative font-headline text-3xl font-semibold italic tracking-tight">{t('app.name')}</h1>
      <p className="relative mt-3 font-label text-xs uppercase tracking-[0.3em] text-primary-fixed-dim">{t('auth.splash.tagline')}</p>
    </div>
  );
}
