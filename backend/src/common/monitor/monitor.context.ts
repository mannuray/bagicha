import { AsyncLocalStorage } from 'async_hooks';
import type { MonitorRequestContext } from './monitor.types';

const storage = new AsyncLocalStorage<MonitorRequestContext>();

export const MonitorContext = {
  run<T>(ctx: MonitorRequestContext, fn: () => T): T {
    return storage.run(ctx, fn);
  },
  get(): MonitorRequestContext | undefined {
    return storage.getStore();
  },
  update(patch: Partial<MonitorRequestContext>): void {
    const current = storage.getStore();
    if (!current) return;
    Object.assign(current, patch);
  },
};
