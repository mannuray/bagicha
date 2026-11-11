import { createContext, useContext } from 'react';

/**
 * Small persistent key-value storage, injected rather than read from a global
 * (coding principles §3). Web uses localStorage; tests use memory; a Capacitor
 * build can swap in its own. Never throws: unavailable storage (private mode) is
 * treated as empty.
 */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const localKeyValueStore: KeyValueStore = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable: the value lives only in memory for this tab.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to clear.
    }
  },
};

export function memoryKeyValueStore(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    get: (key) => values.get(key) ?? null,
    set: (key, value) => void values.set(key, value),
    remove: (key) => void values.delete(key),
  };
}

const StorageContext = createContext<KeyValueStore | null>(null);
export const StorageProvider = StorageContext.Provider;

/** The app's storage (localStorage in the browser, memory in tests). */
export function useStorage(): KeyValueStore {
  const storage = useContext(StorageContext);
  if (!storage) throw new TypeError('useStorage must be used inside <StorageProvider>');
  return storage;
}
