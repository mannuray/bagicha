import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Screen } from '../../ui';

/** Shared onboarding frame: gradient band, rounded content sheet, step indicator. */
export function OnboardingLayout({
  step,
  icon,
  title,
  subtitle,
  children,
}: {
  step: 1 | 2 | 3;
  icon: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Screen>
      <div className="bg-primary-gradient relative flex h-36 items-center pb-6 justify-center overflow-hidden">
        <div className="pebble-large absolute -right-10 -top-10 h-28 w-28 bg-primary-fixed-dim/10" aria-hidden />
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
          <Icon name={icon} filled className="text-2xl text-on-primary" />
        </div>
      </div>
      <main className="relative -mt-8 rounded-t-[32px] bg-surface px-5 pb-10 pt-6">
        <p className="mb-4 text-center font-label text-[11px] font-bold uppercase tracking-widest text-outline">
          {t('onboarding.step', { step, total: 3 })}
        </p>
        <h1 className="mb-3 text-center font-headline text-2xl font-bold leading-tight text-primary">{title}</h1>
        <p className="mb-4 text-center font-body text-base leading-relaxed text-on-surface-variant">{subtitle}</p>
        {children}
      </main>
    </Screen>
  );
}
