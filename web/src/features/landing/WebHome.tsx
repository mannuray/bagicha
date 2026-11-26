import type { ReactNode } from 'react';
import { isNativeApp } from '../../lib/platform';
import { useSession } from '../auth';
import { LandingPage } from './LandingPage';

/**
 * The home address. A visitor on the website sees the landing page; a gardener
 * who is signed in, the phone app, and a session that just expired all get
 * `app` (which sends anyone signed out to sign-in).
 */
export function WebHome({ app, native = isNativeApp() }: { app: ReactNode; native?: boolean }) {
  const { user, expired } = useSession();
  if (!user && !expired && !native) return <LandingPage />;
  return <>{app}</>;
}
