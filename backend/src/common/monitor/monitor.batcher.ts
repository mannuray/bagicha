import type { MonitorEvent } from './monitor.types';

interface BatcherConfig {
  url: string;
  enabled: boolean;
  flushIntervalMs: number;
  maxBatchSize: number;
  onError: (error: unknown, eventCount: number) => void;
}

/**
 * In-memory queue + interval flusher. Sends events to kathawachak in batches
 * to keep per-request overhead bounded when instrumentation density is high
 * (e.g. one Prisma query per business call generates one event each).
 *
 * Drops events silently if the queue grows beyond a hard cap — telemetry
 * must never back-pressure the host application.
 */
export class MonitorBatcher {
  private readonly queue: MonitorEvent[] = [];
  private timer: NodeJS.Timeout | null = null;
  private flushing = false;
  private readonly hardCap: number;

  constructor(private readonly config: BatcherConfig) {
    this.hardCap = Math.max(config.maxBatchSize * 10, 1000);
  }

  enqueue(event: MonitorEvent): void {
    if (!this.config.enabled) return;
    if (this.queue.length >= this.hardCap) return;
    this.queue.push(event);
    if (this.queue.length >= this.config.maxBatchSize) {
      void this.flush();
      return;
    }
    this.ensureTimer();
  }

  private ensureTimer(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.config.flushIntervalMs);
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    if (this.queue.length === 0) return;
    this.flushing = true;
    const batch = this.queue.splice(0, this.queue.length);
    try {
      const url = `${this.config.url.replace(/\/$/, '')}/api/ingest/events`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
      if (!response.ok) {
        this.config.onError(
          new Error(`kathawachak ingest returned HTTP ${response.status}`),
          batch.length,
        );
      }
    } catch (error) {
      this.config.onError(error, batch.length);
    } finally {
      this.flushing = false;
    }
  }

  async drain(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    while (this.queue.length > 0 || this.flushing) {
      await this.flush();
    }
  }
}
