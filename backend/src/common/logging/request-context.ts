import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  requestId: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

/** Per-request context (request id, authenticated user) for log enrichment. */
export const RequestContext = {
  run<T>(store: RequestContextStore, fn: () => T): T {
    return storage.run(store, fn);
  },
  get(): RequestContextStore | undefined {
    return storage.getStore();
  },
  setUser(userId: string): void {
    const store = storage.getStore();
    if (store) store.userId = userId;
  },
};
