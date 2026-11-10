import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS, RateLimitBucket } from './limits';
import {
  BucketRateLimitGuard,
  rateLimitBucketMetadata,
} from './rate-limit.guards';

/** Puts a route in a shared rate-limit bucket (see limits.ts). */
export function RateLimit(bucket: RateLimitBucket) {
  return applyDecorators(
    rateLimitBucketMetadata(bucket),
    Throttle({ default: RATE_LIMITS[bucket] }),
    UseGuards(BucketRateLimitGuard),
  );
}
