import { Injectable, OnApplicationShutdown } from '@nestjs/common';

interface ShutdownableSdk {
  shutdown(): Promise<void>;
}

const HANDLE = Symbol.for('bagicha.otel.sdk');
type WithHandle = typeof globalThis & { [HANDLE]?: ShutdownableSdk };

/** Called by instrumentation.ts (loaded via --require) so Nest can flush it on shutdown. */
export function registerOtelSdk(sdk: ShutdownableSdk | undefined): void {
  (globalThis as WithHandle)[HANDLE] = sdk;
}

/**
 * Flushes spans/metrics as the last step of Nest's graceful shutdown, so the
 * signal is owned by Nest (which drains requests and closes connections first).
 */
@Injectable()
export class OtelShutdownHook implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await (globalThis as WithHandle)[HANDLE]?.shutdown();
  }
}
