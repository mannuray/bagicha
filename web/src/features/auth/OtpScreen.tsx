import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { isApiError } from '../../lib/errors';
import { messageFor } from '../../lib/error-messages';
import olivePhoto from '../../assets/stitch/otp-olive.jpg';
import { Button, cx, Screen, TopBar } from '../../ui';
import { useRequestOtp, useVerifyOtp } from './api';
import { homeFor } from './schemas';
import { z } from 'zod';

const OTP_LENGTH = 6;

/** What Login hands over in navigation state; anything else counts as nothing. */
const otpStateSchema = z.object({ phone: z.string().optional(), devOtp: z.string().optional() });

export function OtpScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const parsed = otpStateSchema.safeParse(useLocation().state);
  const state = parsed.success ? parsed.data : null;
  const phone = state?.phone;
  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(state?.devOtp);
  const [focused, setFocused] = useState(false);

  if (!phone) return <Navigate to="/login" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== OTP_LENGTH) return;
    verify.mutate(
      { phone, otp: code },
      {
        onSuccess: ({ user }) =>
          navigate(homeFor(user), { replace: true }),
      },
    );
  };

  const wrongCode = isApiError(verify.error) && verify.error.code === 'AUTH_INVALID_OTP';

  return (
    <Screen className="flex flex-col">
      <TopBar title={t('auth.otp.bar')} />
      <main className="flex flex-1 flex-col px-4 pb-6 pt-4">
        <div className="relative mb-6 h-32 overflow-hidden rounded-xl bg-primary-container">
          <img src={olivePhoto} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" aria-hidden />
        </div>
        <section className="mb-6">
          <h1 className="mb-2 font-headline text-2xl leading-tight tracking-tight text-primary">{t('auth.otp.title')}</h1>
          <p className="font-body text-base text-on-surface-variant">
            {t('auth.otp.subtitle')} <span className="font-bold text-on-surface">{phone.replace(/^\+91/, '+91 ')}</span>
          </p>
          {devOtp && (
            <p className="mt-3 inline-block rounded-full bg-secondary-container px-4 py-1.5 font-label text-sm font-bold text-on-secondary-container">
              {t('auth.otp.testCode', { code: devOtp })}
            </p>
          )}
        </section>
        <form onSubmit={submit} className="flex flex-1 flex-col" noValidate>
          <label htmlFor="otp" className="sr-only">
            {t('auth.otp.label')}
          </label>
          <div className="relative mb-4">
            <div className="flex justify-between gap-2" aria-hidden>
              {Array.from({ length: OTP_LENGTH }, (_, i) => {
                const active = focused && i === Math.min(code.length, OTP_LENGTH - 1);
                return (
                  <div
                    key={i}
                    data-testid="otp-box"
                    className={cx(
                      'pebble-large flex h-14 flex-1 items-center justify-center font-headline text-2xl text-primary transition-all duration-300',
                      active ? 'bg-surface-container shadow-md ring-2 ring-primary/10' : 'bg-surface-container-low shadow-sm',
                    )}
                  >
                    {code[i] ?? (active ? <span className="h-6 w-[2px] animate-pulse bg-primary" /> : '')}
                  </div>
                );
              })}
            </div>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={code}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </div>
          {verify.isError && (
            <p role="alert" className="mb-4 text-center font-body text-sm text-error">
              {messageFor(verify.error)}
            </p>
          )}
          <div className="mt-auto space-y-4 pt-6">
            <Button type="submit" block busy={verify.isPending} disabled={code.length !== OTP_LENGTH} className="py-3 text-base">
              {t('auth.otp.submit')}
            </Button>
            <p className="text-center font-label text-sm tracking-wide text-on-surface-variant">
              {t('auth.otp.noCode')}
              <Button
                variant="tertiary"
                className="ml-1 px-2 text-secondary"
                busy={resend.isPending}
                onClick={() =>
                  resend.mutate(phone, {
                    onSuccess: (res) => {
                      setCode('');
                      setDevOtp(res.dev_otp);
                    },
                  })
                }
              >
                {wrongCode ? t('auth.otp.newCode') : t('auth.otp.resend')}
              </Button>
            </p>
            {resend.isError && (
              <p role="alert" className="text-center font-body text-sm text-error">
                {messageFor(resend.error)}
              </p>
            )}
          </div>
        </form>
      </main>
    </Screen>
  );
}
