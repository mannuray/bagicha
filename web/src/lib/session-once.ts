import { createContext, useContext } from 'react';

/**
 * Things asked of the server once per sign-in (a plant's seasonal tasks, the crop
 * sync). Owned here, not by the auth store; the app clears it when the user changes.
 */
export type SessionOnce = Set<string>;

export const createSessionOnce = (): SessionOnce => new Set<string>();

interface UserSource {
  get(): { user: { id: string } | null };
  subscribe(listener: () => void): () => void;
}

/** Clears `once` whenever the signed-in user changes (sign-in, sign-out, expiry). */
export function clearOnUserChange(session: UserSource, once: SessionOnce): () => void {
  let userId = session.get().user?.id ?? null;
  return session.subscribe(() => {
    const next = session.get().user?.id ?? null;
    if (next !== userId) once.clear();
    userId = next;
  });
}

const SessionOnceContext = createContext<SessionOnce>(createSessionOnce());
export const SessionOnceProvider = SessionOnceContext.Provider;
export const useSessionOnce = (): SessionOnce => useContext(SessionOnceContext);
