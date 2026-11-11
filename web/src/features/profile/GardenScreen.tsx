import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Button, cx, Icon, Screen } from '../../ui';
import { useSession } from '../auth';
import { useOnboardingStep } from './useOnboardingStep';
import heroPhoto from '../../assets/stitch/garden-hero.jpg';
import treesPhoto from '../../assets/stitch/garden-trees.jpg';
import veggiesPhoto from '../../assets/stitch/garden-veggies.jpg';
import flowersPhoto from '../../assets/stitch/garden-flowers.jpg';

const TYPES = [
  { id: 'trees', photo: treesPhoto },
  { id: 'veggies', photo: veggiesPhoto },
  { id: 'flowers', photo: flowersPhoto },
] as const;

/** Stitch "Your Green Blueprint", with its photos bundled locally. */
export function GardenScreen() {
  const { t } = useTranslation();
  const { user } = useSession();
  const step = useOnboardingStep('garden');
  const [types, setTypes] = useState<string[]>(user?.garden_types ?? []);

  const toggle = (type: string) =>
    setTypes((current) => (current.includes(type) ? current.filter((t) => t !== type) : [...current, type]));

  return (
    <Screen>
      <header className="relative flex h-48 items-center justify-center overflow-hidden bg-primary-container pb-6">
        <img src={heroPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative flex aspect-square w-28 flex-col items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
          <Icon name="spa" className="text-2xl text-on-primary" />
          <p className="font-headline text-xl font-bold italic tracking-tight text-on-primary">{t('app.name')}</p>
        </div>
      </header>
      <main className="relative -mt-8 rounded-t-[32px] bg-surface px-4 pb-10 pt-6">
        <p className="mb-2 font-label text-[11px] font-bold uppercase tracking-widest text-outline">
          {t('onboarding.step', { step: 3, total: 3 })}
        </p>
        <h1 className="mb-2 font-headline text-2xl font-bold leading-tight text-primary">{t('onboarding.garden.title')}</h1>
        <p className="mb-6 font-body text-base leading-relaxed text-on-surface-variant">{t('onboarding.garden.subtitle')}</p>
        <div className="mb-8 space-y-3">
          {TYPES.map(({ id, photo }) => {
            const selected = types.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(id)}
                className={cx(
                  'flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all duration-300',
                  selected ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary hover:bg-surface-container',
                )}
              >
                <span className="pebble-large h-14 w-14 shrink-0 overflow-hidden bg-surface-container-highest">
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-headline text-lg font-bold">{t(`onboarding.garden.types.${id}`)}</span>
                  <span
                    className={cx(
                      'mt-0.5 block font-label text-xs uppercase tracking-wider',
                      selected ? 'text-on-primary-container' : 'text-on-surface-variant',
                    )}
                  >
                    {t(`onboarding.garden.hints.${id}`)}
                  </span>
                </span>
                {selected ? (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white" aria-hidden>
                    <Icon name="check" filled className="text-lg text-primary" />
                  </span>
                ) : (
                  <span className="h-7 w-7 shrink-0 rounded-full border border-outline-variant/40" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
        {step.error !== null && (
          <p role="alert" className="mb-4 text-center font-body text-sm text-error">
            {messageFor(step.error)}
          </p>
        )}
        <Button
          block
          busy={step.busy}
          disabled={types.length === 0}
          className="py-3 text-base"
          onClick={() => step.save({ garden_types: types })}
        >
          {t('onboarding.garden.finish')}
          <Icon name="arrow_forward" />
        </Button>
      </main>
    </Screen>
  );
}
