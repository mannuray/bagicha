import { useTranslation } from 'react-i18next';
import leafPhoto from '../../assets/stitch/login-leaf.jpg';
import { BagichaLogo } from '../../ui';

/** The sign-in canopy: the Budtale logo and name centred on the mango-leaf photo, which fades into the page. */
export function AuthHero() {
  const { t } = useTranslation();
  return (
    <header className="relative flex h-[46dvh] max-h-[400px] min-h-[260px] w-full shrink-0 flex-col items-center justify-center overflow-hidden bg-primary-container pb-10 pt-[env(safe-area-inset-top,0px)]">
      <img src={leafPhoto} alt="" className="absolute inset-0 h-full w-full scale-[1.03] object-cover" />
      {/* Darkens the photo behind the name so cream text reads, then fades to the page colour. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(23,49,36,0.55)_0%,rgba(23,49,36,0.15)_60%,transparent_80%)]" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent via-surface/70 to-surface" aria-hidden />
      <BagichaLogo size={72} className="relative drop-shadow-[0_8px_24px_rgba(6,32,20,0.35)]" />
      <p className="relative mt-3 font-headline text-[34px] font-semibold tracking-tight text-on-primary drop-shadow-[0_2px_12px_rgba(6,32,20,0.5)]">
        {t('app.name')}
      </p>
    </header>
  );
}
