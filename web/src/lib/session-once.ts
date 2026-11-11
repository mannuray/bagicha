import { createContext, useContext } from 'react';

/**
 * Things asked of the server once per sign-in (a plant's seasonal tasks, the crop
 * sync). Owned here, not by the auth store; the app clears it when the user changes.
 */
export type SessionOnce = Set<string>;

export const createSessionOnce = (): SessionOnce => new Set<string>();

interface UserSource {
  get(): { user: { id: string } | null; signIns: number };
  subscribe(listener: () => void): () => void;
}

/** Clears `once` on every sign-in (even as the same user), sign-out and expiry; not on profile edits. */
export function clearOnUserChange(session: UserSource, once: SessionOnce): () => void {
  const key = () => `${session.get().user?.id ?? ''}#${session.get().signIns}`;
  let last = key();
  return session.subscribe(() => {
    const next = key();
    if (next !== last) once.clear();
    last = next;
  });
}

const SessionOnceContext = createContext<SessionOnce | null>(null);
export const SessionOnceProvider = SessionOnceContext.Provider;

export function useSessionOnce(): SessionOnce {
  const once = useContext(SessionOnceContext);
  if (!once) throw new TypeError('useSessionOnce must be used inside <SessionOnceProvider>');
  return once;
}
