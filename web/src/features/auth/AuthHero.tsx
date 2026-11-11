import { useTranslation } from 'react-i18next';
import leafPhoto from '../../assets/stitch/login-leaf.jpg';
import { BagichaLogo } from '../../ui';

/** Stitch login hero, with its mango-leaf photo bundled locally. */
export function AuthHero() {
  const { t } = useTranslation();
  return (
    <header className="relative flex h-[240px] w-full flex-col items-center justify-center overflow-hidden bg-primary-container px-4 pb-8 text-center">
      <img src={leafPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-primary/20 backdrop-brightness-95" aria-hidden />
      <BagichaLogo size={52} className="relative mb-2 drop-shadow-lg" />
      <p className="relative font-headline text-2xl font-semibold italic tracking-tight text-on-primary">{t('app.name')}</p>
    </header>
  );
}
