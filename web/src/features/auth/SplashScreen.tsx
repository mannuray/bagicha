import { useTranslation } from 'react-i18next';
import leaves from '../../assets/stitch/splash-leaves.jpg';
import { BagichaLogo } from '../../ui';
import { useSplashRedirect } from './useSplashRedirect';

/**
 * Stitch "Splash - Dewlit Sprout & Orchard" (owner's pick, 2026-11-26): leaves (the Natural Sanctuary photo) in morning
 * light behind the logo, which sits where the Android launch screen's sprout was.
 */
export function SplashScreen() {
  const { t } = useTranslation();
  useSplashRedirect();

  return (
    <div className="relative flex min-h-dvh select-none flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-primary via-[#152a1f] to-[#122218] px-6 text-center text-[#fbf8f2]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img src={leaves} alt="" className="h-full w-full scale-105 object-cover object-center opacity-30 mix-blend-luminosity" />
        {/* Morning sun from the top right. */}
        <div className="absolute right-0 top-0 h-96 w-96 -translate-y-16 translate-x-12 rounded-full bg-gradient-to-br from-[#ffe4a0]/20 via-[#c6ca98]/10 to-transparent blur-[90px]" />
        <div className="absolute inset-0 bg-radial from-transparent via-primary/60 to-[#122218]/95" />
        <div className="absolute left-1/4 top-1/3 h-2 w-2 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)] blur-[0.5px]" />
        <div className="absolute right-[22%] top-[28%] h-2.5 w-2.5 rounded-full bg-[#e2e7b2]/40 blur-[1px]" />
        <div className="absolute bottom-1/3 right-1/4 h-1.5 w-1.5 rounded-full bg-white/50 blur-[0.5px]" />
      </div>

      <div className="relative mb-8 flex items-center justify-center">
        <div className="splash-aura absolute h-28 w-28 rounded-full bg-[#e8f5e9]/10 blur-xl" aria-hidden />
        <div className="absolute h-36 w-36 rounded-full bg-[#c6ca98]/10 blur-2xl" aria-hidden />
        <BagichaLogo size={80} className="relative drop-shadow-xl" />
      </div>

      {/* Terracotta soil line. */}
      <div className="relative mb-7 flex items-center gap-2" aria-hidden>
        <span className="h-[1.5px] w-6 rounded-full bg-[#c36a4d]/40" />
        <span className="h-[2px] w-12 rounded-full bg-[#c36a4d] shadow-[0_0_6px_rgba(195,106,77,0.5)]" />
        <span className="h-[1.5px] w-6 rounded-full bg-[#c36a4d]/40" />
      </div>

      <h1 className="relative mb-3 font-headline text-5xl italic tracking-[-0.01em] drop-shadow-sm">{t('app.name')}</h1>
      <p className="relative mb-3 font-label text-xs font-medium uppercase tracking-[0.28em] text-[#fbf8f2]/75">{t('auth.splash.tagline')}</p>
      <p className="relative text-[13px] tracking-[0.22em] text-[#c6ca98] opacity-90">{t('auth.splash.grows')}</p>
    </div>
  );
}
