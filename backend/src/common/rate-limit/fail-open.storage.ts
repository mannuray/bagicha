import { Inject, Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export const RATE_LIMIT_BACKEND = Symbol('RATE_LIMIT_BACKEND');

const ALLOW: ThrottlerStorageRecord = {
  totalHits: 0,
  timeToExpire: 0,
  isBlocked: false,
  timeToBlockExpire: 0,
};

/**
 * Wraps the Redis store so an outage lets traffic through instead of
 * taking the API down. This is the one deliberate fail-open in the app.
 */
@Injectable()
export class FailOpenThrottlerStorage implements ThrottlerStorage {
  constructor(
    @Inject(RATE_LIMIT_BACKEND) private readonly backend: ThrottlerStorage,
    @InjectPinoLogger(FailOpenThrottlerStorage.name)
    private readonly logger: PinoLogger,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      return await this.backend.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    } catch (err: unknown) {
      this.logger.warn(
        { err },
        'Rate-limit store unavailable; allowing request',
      );
      return ALLOW;
    }
  }
}
