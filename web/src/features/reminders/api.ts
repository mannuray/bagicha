import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '../../lib/api';

/** Tells the server this phone can receive reminders (or refreshes it). */
export function useRegisterDevice() {
  const api = useApi();
  return useMutation({
    mutationFn: (token: string) => api.send('PUT', '/user/devices', { token, platform: 'ANDROID' }, z.undefined()),
  });
}
