/** Where the session token lives. Web uses localStorage; a Capacitor build can swap in secure storage. */
export interface TokenStore {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

const KEY = 'bagicha.token';

export const localTokenStore: TokenStore = {
  get() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      // Storage unavailable (private mode): the session lasts for this tab only.
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
