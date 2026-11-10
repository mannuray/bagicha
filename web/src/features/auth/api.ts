import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { useSession } from './session';
import { verifyResponseSchema } from './schemas';

export function useRequestOtp() {
  const api = useApi();
  return useMutation({
    mutationFn: (phone: string) =>
      api.send('POST', '/auth/request-otp', { phone_number: phone }, z.string()),
  });
}

export function useVerifyOtp() {
  const api = useApi();
  const { signIn } = useSession();
  return useMutation({
    mutationFn: (input: { phone: string; otp: string }) =>
      api.send(
        'POST',
        '/auth/verify-otp',
        { phone_number: input.phone, otp: input.otp },
        verifyResponseSchema,
      ),
    onSuccess: (res) => signIn(res.access_token, res.user),
  });
}

/** Indian mobile number as the backend expects it, or null if it isn't one. */
export function toE164India(input: string): string | null {
  const digits = input.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}
