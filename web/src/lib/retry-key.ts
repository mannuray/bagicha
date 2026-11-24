import { cryptoRequestId } from './api-client';

/**
 * An Idempotency-Key for one thing the gardener is saving: the same key while
 * the same content is sent again (a tap on Save after a timeout), a new one
 * once it went through or the content changed. The server turns a repeat into
 * the first answer instead of a second entry.
 */
export function createRetryKey() {
  let last: { body: string; key: string } | null = null;
  return {
    keyFor(body: unknown): string {
      const sent = JSON.stringify(body);
      if (last?.body !== sent) last = { body: sent, key: cryptoRequestId() };
      return last.key;
    },
    done(): void {
      last = null;
    },
  };
}
