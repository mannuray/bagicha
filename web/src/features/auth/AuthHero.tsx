import { useTranslation } from 'react-i18next';
import leafPhoto from '../../assets/stitch/login-leaf.jpg';
import { BagichaLogo } from '../../ui';

/** The sign-in canopy: the mango-leaf photo fading into the cream page, with the Budtale name on a pill. */
export function AuthHero() {
  const { t } = useTranslation();
  return (
    <header className="relative h-[40dvh] max-h-[340px] min-h-[220px] w-full shrink-0 overflow-hidden bg-primary-container">
      <img src={leafPhoto} alt="" className="absolute inset-0 h-full w-full scale-[1.03] object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/25 to-surface" aria-hidden />
      <div className="absolute inset-x-0 -bottom-1 h-16 bg-gradient-to-t from-surface via-surface/90 to-transparent" aria-hidden />
      <div className="absolute left-5 top-[calc(env(safe-area-inset-top,0px)+1rem)] inline-flex items-center gap-2 rounded-full bg-surface/85 py-1.5 pl-1.5 pr-3.5 shadow-[0_4px_24px_rgba(23,49,36,0.07)] backdrop-blur-md">
        <BagichaLogo size={26} />
        <span className="font-headline text-[17px] font-semibold tracking-tight text-primary">{t('app.name')}</span>
      </div>
    </header>
  );
}
