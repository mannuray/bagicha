import { localKeyValueStore, type KeyValueStore } from './storage';

/** Where the session token lives. Web uses localStorage; a Capacitor build can swap in secure storage. */
export interface TokenStore {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

const KEY = 'bagicha.token';

/** A token store over key-value storage (web: localStorage). */
export function createTokenStore(storage: KeyValueStore): TokenStore {
  return {
    get: () => storage.get(KEY),
    set: (token) => storage.set(KEY, token),
    clear: () => storage.remove(KEY),
  };
}

export const localTokenStore: TokenStore = createTokenStore(localKeyValueStore);
