import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { catchError, from, Observable, of, switchMap, tap } from 'rxjs';
import { ConflictError, ValidationError } from '../errors';
import { RedisService } from '../redis/redis.service';

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
/** Long enough for a phone to retry after a dropped connection, short enough to forget. */
const DONE_TTL_SECONDS = 24 * 60 * 60;
/** A request still running after this is treated as lost; a retry may run again. */
const PENDING_TTL_SECONDS = 60;
const PENDING = 'pending';
/**
 * The shared Redis client queues commands while disconnected (BullMQ needs
 * that), so a Redis outage would hang the request; give up quickly instead.
 */
const REDIS_WAIT_MS = 500;
const DONE = 'done:';

/**
 * A create sent twice with one Idempotency-Key happens once: the retry gets
 * the first answer back, a copy that arrives while the first is still running
 * gets 409 (try again shortly), and a failed create frees the key. No header,
 * no change. If Redis is down the request runs as if no key were sent.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: RedisService,
    @InjectPinoLogger(IdempotencyInterceptor.name)
    private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: string } }>();
    const header = req.headers['idempotency-key'];
    const key = Array.isArray(header) ? header[0] : header;
    if (key === undefined) return next.handle();
    if (!KEY_PATTERN.test(key))
      throw new ValidationError(
        'IDEMPOTENCY_KEY_INVALID',
        'Idempotency-Key must be 8–128 letters, digits, - or _',
      );
    // The real path, not the route pattern: one key reused on another plant is a new request.
    const slot = `idem:${req.user?.id ?? 'anon'}:${req.path}:${key}`;
    return from(this.claim(slot)).pipe(
      switchMap((claim) => {
        if (claim.kind === 'replay') return of(claim.body);
        if (claim.kind === 'busy')
          throw new ConflictError(
            'IDEMPOTENCY_IN_PROGRESS',
            'This request is already being handled; try again in a moment',
          );
        if (claim.kind === 'unavailable') return next.handle();
        return next.handle().pipe(
          tap((body) => void this.remember(slot, body)),
          catchError((err: unknown) => {
            void this.forget(slot);
            throw err;
          }),
        );
      }),
    );
  }

  private async claim(
    slot: string,
  ): Promise<
    | { kind: 'claimed' }
    | { kind: 'busy' }
    | { kind: 'replay'; body: unknown }
    | { kind: 'unavailable' }
  > {
    try {
      if (
        await withinWait(
          this.redis.setIfAbsent(slot, PENDING, PENDING_TTL_SECONDS),
        )
      )
        return { kind: 'claimed' };
      const stored = await withinWait(this.redis.get(slot));
      if (stored?.startsWith(DONE))
        return { kind: 'replay', body: JSON.parse(stored.slice(DONE.length)) };
      // Pending, or expired between the two calls: either way not ours to run now.
      return { kind: 'busy' };
    } catch (err: unknown) {
      this.logger.warn(
        { err },
        'Idempotency store unavailable; running request',
      );
      return { kind: 'unavailable' };
    }
  }

  private async remember(slot: string, body: unknown): Promise<void> {
    try {
      await this.redis.set(
        slot,
        DONE + JSON.stringify(body ?? null),
        DONE_TTL_SECONDS,
      );
    } catch (err: unknown) {
      this.logger.warn({ err }, 'Idempotency answer not stored');
    }
  }

  private async forget(slot: string): Promise<void> {
    try {
      await withinWait(this.redis.del(slot));
    } catch (err: unknown) {
      this.logger.warn({ err }, 'Idempotency key not released');
    }
  }
}

/** The Redis call's result, or a rejection once REDIS_WAIT_MS has passed. */
function withinWait<T>(call: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('Redis did not answer in time')),
      REDIS_WAIT_MS,
    );
  });
  return Promise.race([call, timeout]).finally(() => clearTimeout(timer));
}
