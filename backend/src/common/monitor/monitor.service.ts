import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitorBatcher } from './monitor.batcher';
import type { MonitorEvent } from './monitor.types';

interface MonitorConfig {
  url: string;
  service: string;
  environment: string;
  enabled: boolean;
  flush_interval_ms: number;
  max_batch_size: number;
}

@Injectable()
export class MonitorService implements OnModuleDestroy {
  private readonly logger = new Logger(MonitorService.name);
  private readonly config: MonitorConfig;
  private readonly batcher: MonitorBatcher;

  constructor(private readonly configService: ConfigService) {
    const isTestEnv =
      this.configService.get<string>('NODE_ENV', '').toLowerCase() === 'test';
    const enabledFromEnv =
      this.configService
        .get<string>('KATHAWACHAK_ENABLED', 'false')
        .toLowerCase() === 'true';

    this.config = {
      url: this.configService.get<string>(
        'KATHAWACHAK_URL',
        'http://localhost:3201',
      ),
      service: this.configService.get<string>(
        'KATHAWACHAK_SERVICE',
        'bagicha-backend',
      ),
      environment: this.configService.get<string>(
        'KATHAWACHAK_ENVIRONMENT',
        this.configService.get<string>('NODE_ENV', 'dev'),
      ),
      enabled: enabledFromEnv && !isTestEnv,
      flush_interval_ms: Number(
        this.configService.get<string>('KATHAWACHAK_BATCH_INTERVAL_MS', '200'),
      ),
      max_batch_size: Number(
        this.configService.get<string>('KATHAWACHAK_BATCH_MAX_SIZE', '50'),
      ),
    };

    this.batcher = new MonitorBatcher({
      url: this.config.url,
      enabled: this.config.enabled,
      flushIntervalMs: Number.isFinite(this.config.flush_interval_ms)
        ? this.config.flush_interval_ms
        : 200,
      maxBatchSize: Number.isFinite(this.config.max_batch_size)
        ? this.config.max_batch_size
        : 50,
      onError: (error, eventCount) => {
        // Fixed message, no error text: it can carry the collector URL.
        const type =
          error instanceof Error ? error.constructor.name : typeof error;
        this.logger.warn({
          eventCount,
          errorType: type,
          message: 'telemetry push failed',
        });
      },
    });
  }

  get serviceName(): string {
    return this.config.service;
  }

  get environment(): string {
    return this.config.environment;
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  emit(event: MonitorEvent): void {
    this.batcher.enqueue(event);
  }

  async onModuleDestroy(): Promise<void> {
    await this.batcher.drain();
  }
}
