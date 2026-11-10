import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { isApiError } from '../../lib/errors';
import { messageFor } from '../../lib/error-messages';
import { Button, Icon, Screen, TopBar } from '../../ui';
import { useRequestOtp, useVerifyOtp } from './api';
import { isProfileComplete, onboardingStart } from './schemas';

export function OtpScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const phone = (useLocation().state as { phone?: string } | null)?.phone;
  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const [code, setCode] = useState('');

  if (!phone) return <Navigate to="/login" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    verify.mutate(
      { phone, otp: code },
      {
        onSuccess: ({ user }) =>
          navigate(isProfileComplete(user) ? '/' : onboardingStart(user), { replace: true }),
      },
    );
  };

  const wrongCode = isApiError(verify.error) && verify.error.code === 'AUTH_INVALID_OTP';

  return (
    <Screen>
      <TopBar title={t('auth.otp.bar')} />
      <main className="flex flex-col items-center px-8 pt-10">
        <div className="pebble-large mb-8 flex h-24 w-24 items-center justify-center bg-surface-container text-primary">
          <Icon name="eco" filled className="text-4xl" />
        </div>
        <h1 className="mb-3 text-center font-headline text-3xl font-bold leading-tight text-primary">{t('auth.otp.title')}</h1>
        <p className="mb-10 px-4 text-center font-body text-sm text-on-surface-variant">
          {t('auth.otp.subtitle', { phone })}
        </p>
        <form onSubmit={submit} className="w-full space-y-6" noValidate>
          <label htmlFor="otp" className="sr-only">
            {t('auth.otp.label')}
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="······"
            className="w-full rounded-[1rem] bg-surface-container-low py-5 text-center font-body text-3xl font-bold tracking-[0.6em] text-primary focus:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          {verify.isError && (
            <p role="alert" className="text-center font-body text-sm text-error">
              {messageFor(verify.error)}
            </p>
          )}
          <Button type="submit" block busy={verify.isPending} disabled={code.length !== 6} className="py-4 text-lg">
            {t('auth.otp.submit')}
          </Button>
        </form>
        <Button
          variant="tertiary"
          className="mt-4 text-secondary"
          busy={resend.isPending}
          onClick={() => resend.mutate(phone, { onSuccess: () => setCode('') })}
        >
          {wrongCode ? t('auth.otp.newCode') : t('auth.otp.resend')}
        </Button>
        {resend.isError && (
          <p role="alert" className="mt-2 text-center font-body text-sm text-error">
            {messageFor(resend.error)}
          </p>
        )}
      </main>
    </Screen>
  );
}
