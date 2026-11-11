/** Whether any API request is taking long — on the free Render plan, the server waking up. */
export interface ServerWake {
  get(): boolean;
  set(slow: boolean): void;
  subscribe(listener: () => void): () => void;
}

export function createServerWake(): ServerWake {
  let slow = false;
  const listeners = new Set<() => void>();
  return {
    get: () => slow,
    set(next) {
      if (next === slow) return;
      slow = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
