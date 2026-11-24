import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor';

/** The route honours an Idempotency-Key header (see IdempotencyInterceptor). */
export const Idempotent = () =>
  applyDecorators(UseInterceptors(IdempotencyInterceptor));
