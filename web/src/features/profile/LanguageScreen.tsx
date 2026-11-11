import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Icon, cx } from '../../ui';
import { nextOnboardingStep, useSession } from '../auth';
import { useUpdateProfile } from './api';
import { OnboardingLayout } from './OnboardingLayout';

const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
] as const;

export function LanguageScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const update = useUpdateProfile();
  const [lang, setLang] = useState<string>(user?.language_pref ?? 'en');

  return (
    <OnboardingLayout step={1} icon="translate" title={t('onboarding.language.title')} subtitle={t('onboarding.language.subtitle')}>
      <div className="mb-3 space-y-3">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            aria-pressed={lang === l.code}
            onClick={() => setLang(l.code)}
            className={cx(
              'flex min-h-12 w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors',
              lang === l.code ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface',
            )}
          >
            <span>
              <span className="block font-headline text-lg">{l.native}</span>
              {l.native !== l.english && <span className="font-body text-sm opacity-80">{l.english}</span>}
            </span>
            {lang === l.code && <Icon name="check_circle" filled />}
          </button>
        ))}
      </div>
      {lang !== 'en' && (
        <p className="mb-3 rounded-xl bg-secondary-fixed px-4 py-3 font-body text-sm text-on-secondary-fixed">
          {t('onboarding.language.englishForNow')}
        </p>
      )}
      {update.isError && (
        <p role="alert" className="mb-4 text-center font-body text-sm text-error">
          {messageFor(update.error)}
        </p>
      )}
      <Button
        block
        busy={update.isPending}
        onClick={() => update.mutate({ language_pref: lang }, { onSuccess: (saved) => navigate(nextOnboardingStep(saved, 'language')) })}
      >
        {t('common.continue')}
      </Button>
    </OnboardingLayout>
  );
}
