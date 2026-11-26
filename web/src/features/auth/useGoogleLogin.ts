import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useGoogleSignIn } from './api';
import { CANCELLED, useGooglePort } from './google';
import { loginState } from './nav-state';
import { homeFor } from './schemas';
import { useSession } from './session';

/** ViewModel for Login: getting a Google token (app or website), trading it for a session, and why we're here. */
export function useGoogleLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { expired } = useSession();
  const port = useGooglePort();
  const google = useGoogleSignIn();
  const { mutate } = google;
  const [unavailable, setUnavailable] = useState(false);

  const exchange = useCallback(
    (idToken: string) => mutate(idToken, { onSuccess: ({ user }) => navigate(homeFor(user), { replace: true }) }),
    [mutate, navigate],
  );

  /** Website: Google draws its button here and hands back the token. Stable, so drawing happens once. */
  const renderButton = useCallback(
    (el: HTMLElement, locale: string) => port.renderButton(el, exchange, { locale }),
    [port, exchange],
  );

  /** Phone: open the account sheet. A dismissed sheet is not an error; a broken setup is. */
  const signIn = async () => {
    setUnavailable(false);
    try {
      const token = await port.signIn();
      if (token !== CANCELLED) exchange(token);
    } catch {
      setUnavailable(true);
    }
  };

  return {
    native: port.native,
    signIn,
    renderButton,
    /** Signed out by the server (now, or on the way here). */
    sessionExpired: expired || loginState(location.state).reason === 'expired',
    busy: google.isPending,
    failed: google.isError,
    /** The phone could not open Google sign-in at all. */
    unavailable,
  };
}
