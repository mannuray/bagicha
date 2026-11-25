import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from './session';
import { DELETION_PENDING_PATH, homeFor, isProfileComplete } from './schemas';

/** A signed-in user; an account waiting to be deleted only reaches the screen that lets it keep the account. */
export function RequireAuth({ children, allowPending = false }: { children: ReactNode; allowPending?: boolean }) {
  const { user, expired } = useSession();
  if (!user) {
    return <Navigate to="/login" replace state={expired ? { reason: 'expired' } : undefined} />;
  }
  if (user.deletion_due_at && !allowPending) return <Navigate to={DELETION_PENDING_PATH} replace />;
  return <>{children}</>;
}

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { user } = useSession();
  if (user && !isProfileComplete(user)) return <Navigate to={homeFor(user)} replace />;
  return <>{children}</>;
}
