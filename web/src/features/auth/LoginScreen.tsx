import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Icon, Screen } from '../../ui';
import { toE164India, useRequestOtp } from './api';
import { AuthHero } from './AuthHero';
import { useSession } from './session';

export function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { expired } = useSession();
  const requestOtp = useRequestOtp();
  const [phone, setPhone] = useState('');
  const [invalid, setInvalid] = useState(false);
  const reason = (location.state as { reason?: string } | null)?.reason;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const e164 = toE164India(phone);
    setInvalid(!e164);
    if (!e164) return;
    requestOtp.mutate(e164, {
      onSuccess: (res) => navigate('/login/otp', { state: { phone: e164, devOtp: res.dev_otp } }),
    });
  };

  return (
    <Screen>
      <AuthHero />
      <main className="relative z-10 -mt-8 rounded-t-[2rem] bg-surface px-5 pb-8 pt-8">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-headline text-2xl font-bold tracking-tight text-primary">{t('auth.login.title')}</h1>
          <p className="font-body text-sm font-medium uppercase tracking-[0.15em] text-on-surface-variant">
            {t('auth.login.subtitle')}
          </p>
        </div>
        {(expired || reason === 'expired') && (
          <p role="status" className="mb-3 rounded-xl bg-secondary-fixed px-4 py-3 text-center font-body text-sm text-on-secondary-fixed">
            {t('errors.UNAUTHORIZED')}
          </p>
        )}
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <label htmlFor="phone" className="sr-only">
              {t('auth.login.phoneLabel')}
            </label>
            <div className="flex items-center rounded-full bg-surface-container px-4 py-3 transition-all focus-within:bg-surface-container-high focus-within:ring-2 focus-within:ring-primary/20">
              <span className="mr-3 pr-3 font-semibold text-primary/60">+91</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={t('auth.login.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? 'phone-error' : undefined}
                className="w-full bg-transparent font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
              />
              <Icon name="smartphone" className="text-primary/40" />
            </div>
            {invalid && (
              <p id="phone-error" className="px-4 font-body text-sm text-error">
                {t('auth.login.invalidPhone')}
              </p>
            )}
          </div>
          {requestOtp.isError && (
            <p role="alert" className="text-center font-body text-sm text-error">
              {messageFor(requestOtp.error)}
            </p>
          )}
          <Button type="submit" block busy={requestOtp.isPending} className="py-3 text-lg">
            {t('auth.login.submit')}
          </Button>
        </form>
      </main>
    </Screen>
  );
}
