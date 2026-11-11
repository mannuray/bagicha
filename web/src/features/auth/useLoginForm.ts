import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toE164India, useRequestOtp } from './api';
import { loginState } from './nav-state';
import { useSession } from './session';

/** ViewModel for Login: the phone, its check, asking for a code, and why we're here. */
export function useLoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { expired } = useSession();
  const requestOtp = useRequestOtp();
  const [phone, setPhone] = useState('');
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    const e164 = toE164India(phone);
    setInvalid(!e164);
    if (!e164) return;
    requestOtp.mutate(e164, {
      onSuccess: (res) => navigate('/login/otp', { state: { phone: e164, devOtp: res.dev_otp } }),
    });
  };

  return {
    phone,
    setPhone,
    invalid,
    submit,
    /** Signed out by the server (now, or on the way here). */
    sessionExpired: expired || loginState(location.state).reason === 'expired',
    busy: requestOtp.isPending,
    error: requestOtp.isError ? requestOtp.error : null,
  };
}
