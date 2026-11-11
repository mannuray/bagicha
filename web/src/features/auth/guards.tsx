import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from './session';
import { homeFor, isProfileComplete } from './schemas';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, expired } = useSession();
  if (!user) {
    return <Navigate to="/login" replace state={expired ? { reason: 'expired' } : undefined} />;
  }
  return <>{children}</>;
}

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { user } = useSession();
  if (user && !isProfileComplete(user)) return <Navigate to={homeFor(user)} replace />;
  return <>{children}</>;
}
