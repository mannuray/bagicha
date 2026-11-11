import { useState } from 'react';
import { useSession } from '../auth';
import { useOnboardingStep } from './useOnboardingStep';

/** ViewModel for the language step: the choice (from the profile), then save and go on. */
export function useLanguageStep() {
  const { user } = useSession();
  const step = useOnboardingStep('language');
  const [lang, setLang] = useState<string>(user?.language_pref ?? 'en');
  return { lang, setLang, save: () => step.save({ language_pref: lang }), busy: step.busy, error: step.error };
}

/** ViewModel for the garden step: which kinds of garden (at least one), then save and finish. */
export function useGardenStep() {
  const { user } = useSession();
  const step = useOnboardingStep('garden');
  const [types, setTypes] = useState<string[]>(user?.garden_types ?? []);
  return {
    types,
    toggle: (type: string) => setTypes((current) => (current.includes(type) ? current.filter((x) => x !== type) : [...current, type])),
    canSave: types.length > 0,
    save: () => step.save({ garden_types: types }),
    busy: step.busy,
    error: step.error,
  };
}
