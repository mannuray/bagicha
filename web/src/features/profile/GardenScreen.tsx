import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Chip } from '../../ui';
import { useSession } from '../auth';
import { useUpdateProfile } from './api';
import { OnboardingLayout } from './OnboardingLayout';

const TYPES = ['trees', 'veggies', 'flowers'] as const;

export function GardenScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const update = useUpdateProfile();
  const [types, setTypes] = useState<string[]>(user?.garden_types ?? []);

  const toggle = (type: string) =>
    setTypes((current) => (current.includes(type) ? current.filter((t) => t !== type) : [...current, type]));

  return (
    <OnboardingLayout step={3} icon="yard" title={t('onboarding.garden.title')} subtitle={t('onboarding.garden.subtitle')}>
      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {TYPES.map((type) => (
          <Chip key={type} selected={types.includes(type)} onClick={() => toggle(type)}>
            {t(`onboarding.garden.types.${type}`)}
          </Chip>
        ))}
      </div>
      {update.isError && (
        <p role="alert" className="mb-4 text-center font-body text-sm text-error">
          {messageFor(update.error)}
        </p>
      )}
      <Button
        block
        busy={update.isPending}
        disabled={types.length === 0}
        onClick={() => update.mutate({ garden_types: types }, { onSuccess: () => navigate('/', { replace: true }) })}
      >
        {t('onboarding.garden.finish')}
      </Button>
    </OnboardingLayout>
  );
}
