import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { localKeyValueStore, type KeyValueStore } from '../../lib/storage';
import type { TokenStore } from '../../lib/token-store';
import { userSchema, type User } from './schemas';

const USER_KEY = 'bagicha.user';

export interface SessionState {
  user: User | null;
  /** Set when the server ended the session (401), so login can say why. */
  expired: boolean;
}

export interface SessionStore {
  readonly tokens: TokenStore;
  get(): SessionState;
  subscribe(listener: () => void): () => void;
  signIn(token: string, user: User): void;
  updateUser(user: User): void;
  signOut(): void;
  expire(): void;
}

function loadCachedUser(tokens: TokenStore, storage: KeyValueStore): User | null {
  if (!tokens.get()) return null;
  try {
    const parsed = userSchema.safeParse(JSON.parse(storage.get(USER_KEY) ?? 'null'));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** The signed-in user and token. Lives outside React so the API client can expire it. */
export function createSessionStore(tokens: TokenStore, storage: KeyValueStore = localKeyValueStore): SessionStore {
  const cacheUser = (user: User | null) => (user ? storage.set(USER_KEY, JSON.stringify(user)) : storage.remove(USER_KEY));
  let state: SessionState = { user: loadCachedUser(tokens, storage), expired: false };
  const listeners = new Set<() => void>();
  const set = (next: SessionState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  return {
    tokens,
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    signIn(token, user) {
      tokens.set(token);
      cacheUser(user);
      set({ user, expired: false });
    },
    updateUser(user) {
      cacheUser(user);
      set({ ...state, user });
    },
    signOut() {
      tokens.clear();
      cacheUser(null);
      set({ user: null, expired: false });
    },
    expire() {
      if (!state.user) return;
      tokens.clear();
      cacheUser(null);
      set({ user: null, expired: true });
    },
  };
}

const SessionContext = createContext<SessionStore | null>(null);

export function SessionProvider({ store, children }: { store: SessionStore; children: ReactNode }) {
  return <SessionContext.Provider value={store}>{children}</SessionContext.Provider>;
}

export function useSessionStore(): SessionStore {
  const store = useContext(SessionContext);
  if (!store) throw new TypeError('useSession must be used inside <SessionProvider>');
  return store;
}

export function useSession() {
  const store = useSessionStore();
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  return {
    user: state.user,
    expired: state.expired,
    signIn: store.signIn,
    updateUser: store.updateUser,
    signOut: store.signOut,
  };
}
