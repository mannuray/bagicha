import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { useSession } from './session';
import { verifyResponseSchema } from './schemas';

/**
 * Signs out here at once and tells the server to end every sign-in of this user.
 * The call is sent (with the token) before the token is cleared, and not awaited:
 * a cold server can take half a minute, and the user is already signed out here.
 */
export function useSignOut(): () => void {
  const api = useApi();
  const { signOut } = useSession();
  return () => {
    void api.send('POST', '/auth/sign-out', {}, z.undefined()).catch(() => undefined);
    signOut();
  };
}

/** Trades a Google ID token for our session; on success the gardener is signed in. */
export function useGoogleSignIn() {
  const api = useApi();
  const { signIn } = useSession();
  return useMutation({
    mutationFn: (idToken: string) => api.send('POST', '/auth/google', { id_token: idToken }, verifyResponseSchema),
    onSuccess: (res) => signIn(res.access_token, res.user),
  });
}
