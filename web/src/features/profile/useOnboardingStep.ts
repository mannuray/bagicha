import { useNavigate } from 'react-router';
import { nextOnboardingStep, type OnboardingStep } from '../auth';
import { useUpdateProfile, type ProfileChanges } from './api';

/** Save one onboarding step's answers, then go to the next step (or home). */
export function useOnboardingStep(step: OnboardingStep) {
  const navigate = useNavigate();
  const update = useUpdateProfile();
  return {
    save: (changes: ProfileChanges) =>
      update.mutate(changes, { onSuccess: (saved) => navigate(nextOnboardingStep(saved, step), step === 'garden' ? { replace: true } : undefined) }),
    busy: update.isPending,
    error: update.isError ? update.error : null,
  };
}
