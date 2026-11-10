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
      <div className="bg-primary-gradient relative flex h-48 items-center justify-center overflow-hidden">
        <div className="pebble-large absolute -right-10 -top-10 h-40 w-40 bg-primary-fixed-dim/10" aria-hidden />
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
          <Icon name={icon} filled className="text-3xl text-on-primary" />
        </div>
      </div>
      <main className="relative -mt-12 rounded-t-[48px] bg-surface px-8 pb-16 pt-10">
        <p className="mb-4 text-center font-label text-[11px] font-bold uppercase tracking-widest text-outline">
          {t('onboarding.step', { step, total: 3 })}
        </p>
        <h1 className="mb-3 text-center font-headline text-3xl font-bold leading-tight text-primary">{title}</h1>
        <p className="mb-8 text-center font-body text-base leading-relaxed text-on-surface-variant">{subtitle}</p>
        {children}
      </main>
    </Screen>
  );
}
