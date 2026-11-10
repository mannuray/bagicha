import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { DEFAULT_RATE_LIMIT } from './limits';
import {
  FailOpenThrottlerStorage,
  RATE_LIMIT_BACKEND,
} from './fail-open.storage';
import {
  BucketRateLimitGuard,
  DefaultRateLimitGuard,
} from './rate-limit.guards';

@Global()
@Module({
  providers: [
    {
      provide: RATE_LIMIT_BACKEND,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new ThrottlerStorageRedisService({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(config.get<string>('REDIS_PORT', '6379')),
          // Fail fast instead of queueing when Redis is down (we fail open).
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        }),
    },
    FailOpenThrottlerStorage,
  ],
  exports: [RATE_LIMIT_BACKEND, FailOpenThrottlerStorage],
})
class RateLimitStorageModule {}

@Global()
@Module({
  imports: [
    RateLimitStorageModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, RateLimitStorageModule],
      inject: [FailOpenThrottlerStorage],
      useFactory: (storage: ThrottlerStorage) => ({
        throttlers: [{ name: 'default', ...DEFAULT_RATE_LIMIT }],
        storage,
      }),
    }),
  ],
  providers: [
    BucketRateLimitGuard,
    { provide: APP_GUARD, useClass: DefaultRateLimitGuard },
  ],
  exports: [BucketRateLimitGuard],
})
export class RateLimitModule {}
