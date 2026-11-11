import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { homeFor } from './schemas';
import { useSession } from './session';

export const SPLASH_MS = 1200;

/** After the splash's brand moment, go wherever this user belongs. */
export function useSplashRedirect() {
  const navigate = useNavigate();
  const { user } = useSession();
  useEffect(() => {
    const timer = setTimeout(() => navigate(homeFor(user), { replace: true }), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [navigate, user]);
}
