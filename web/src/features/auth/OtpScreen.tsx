import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import olivePhoto from '../../assets/stitch/otp-olive.jpg';
import { Button, cx, Screen, TopBar } from '../../ui';
import { OTP_LENGTH, useOtpForm } from './useOtpForm';

export function OtpScreen() {
  const { t } = useTranslation();
  const { phone, code, setCode, devOtp, complete, submit, verifying, verifyError, wrongCode, sendAgain, resending, resendError } = useOtpForm();
  const [focused, setFocused] = useState(false);

  if (!phone) return <Navigate to="/login" replace />;

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
          {verifyError !== null && (
            <p role="alert" className="mb-4 text-center font-body text-sm text-error">
              {messageFor(verifyError, t)}
            </p>
          )}
          <div className="mt-auto space-y-4 pt-6">
            <Button type="submit" block busy={verifying} disabled={!complete} className="py-3 text-base">
              {t('auth.otp.submit')}
            </Button>
            <p className="text-center font-label text-sm tracking-wide text-on-surface-variant">
              {t('auth.otp.noCode')}
              <Button
                variant="tertiary"
                className="ml-1 px-2 text-secondary"
                busy={resending}
                onClick={sendAgain}
              >
                {wrongCode ? t('auth.otp.newCode') : t('auth.otp.resend')}
              </Button>
            </p>
            {resendError !== null && (
              <p role="alert" className="text-center font-body text-sm text-error">
                {messageFor(resendError, t)}
              </p>
            )}
          </div>
        </form>
      </main>
    </Screen>
  );
}
