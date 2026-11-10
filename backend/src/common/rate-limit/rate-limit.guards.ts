import { ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerStorage,
} from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { RateLimitedError } from '../errors';
import { Metrics } from '../observability';
import { RateLimitBucket } from './limits';
import { trackerFor } from './user-or-ip.tracker';

export const RATE_LIMIT_BUCKET = 'rateLimitBucket';
export const rateLimitBucketMetadata = (bucket: RateLimitBucket) =>
  SetMetadata(RATE_LIMIT_BUCKET, bucket);

abstract class BaseRateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly metrics: Metrics,
  ) {
    super(options, storage, reflector);
  }

  protected bucketOf(context: ExecutionContext): RateLimitBucket | undefined {
    return this.reflector.getAllAndOverride<RateLimitBucket | undefined>(
      RATE_LIMIT_BUCKET,
      [context.getHandler(), context.getClass()],
    );
  }

  protected getTracker(req: Record<string, any>): Promise<string> {
    return Promise.resolve(trackerFor(req));
  }

  protected throwThrottlingException(
    context: ExecutionContext,

    _detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const bucket = this.bucketOf(context) ?? 'default';
    this.metrics.rateLimitRejected(bucket);
    throw new RateLimitedError(
      'RATE_LIMITED',
      'Too many requests, please slow down',
      { bucket },
    );
  }
}

/** Global guard: the default limit for every route that has no bucket. */
@Injectable()
export class DefaultRateLimitGuard extends BaseRateLimitGuard {
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(this.bucketOf(context) !== undefined);
  }

  protected generateKey(
    context: ExecutionContext,
    tracker: string,

    _name: string,
  ): string {
    return `rl:default:${context.getClass().name}.${context.getHandler().name}:${tracker}`;
  }
}

/**
 * Route guard for named buckets. Applied after the auth guard so signed-in
 * callers are tracked per user; one counter is shared by every route in a bucket.
 */
@Injectable()
export class BucketRateLimitGuard extends BaseRateLimitGuard {
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(this.bucketOf(context) === undefined);
  }

  protected generateKey(
    context: ExecutionContext,
    tracker: string,

    _name: string,
  ): string {
    return `rl:${this.bucketOf(context)}:${tracker}`;
  }
}
