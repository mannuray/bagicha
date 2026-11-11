import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isApiError } from '../../lib/errors';
import { useRequestOtp, useVerifyOtp } from './api';
import { otpState } from './nav-state';
import { homeFor } from './schemas';

export const OTP_LENGTH = 6;

/** ViewModel for the code screen: the code, verify then go where the user belongs, resend. */
export function useOtpForm() {
  const navigate = useNavigate();
  const state = otpState(useLocation().state);
  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(state?.devOtp);
  const phone = state?.phone ?? null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!phone || code.length !== OTP_LENGTH) return;
    verify.mutate({ phone, otp: code }, { onSuccess: ({ user }) => navigate(homeFor(user), { replace: true }) });
  };

  const sendAgain = () => {
    if (!phone) return;
    resend.mutate(phone, {
      onSuccess: (res) => {
        setCode('');
        setDevOtp(res.dev_otp);
      },
    });
  };

  return {
    phone,
    code,
    setCode,
    devOtp,
    complete: code.length === OTP_LENGTH,
    submit,
    verifying: verify.isPending,
    verifyError: verify.isError ? verify.error : null,
    wrongCode: isApiError(verify.error) && verify.error.code === 'AUTH_INVALID_OTP',
    sendAgain,
    resending: resend.isPending,
    resendError: resend.isError ? resend.error : null,
  };
}
