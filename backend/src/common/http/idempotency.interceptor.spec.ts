import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import type { RedisService } from '../redis/redis.service';
import { IdempotencyInterceptor } from './idempotency.interceptor';

const context = (key?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: key ? { 'idempotency-key': key } : {},
        user: { id: 'u1' },
        path: '/api/v1/ledger/plants/p1/journal',
        baseUrl: '/api/v1',
        route: { path: '/ledger/plants/:id/journal' },
      }),
    }),
  }) as unknown as ExecutionContext;
const logger = { warn: jest.fn() };
const handler = (body: unknown = { id: 'e1' }) => {
  const handle = jest.fn(() => of(body));
  return { handle } as unknown as CallHandler & { handle: jest.Mock };
};

describe('IdempotencyInterceptor', () => {
  it('runs the request when Redis does not answer, instead of hanging', async () => {
    const never = () => new Promise<never>(() => undefined);
    const redis = {
      setIfAbsent: jest.fn(never),
      get: jest.fn(never),
      set: jest.fn(never),
      del: jest.fn(never),
    } as unknown as RedisService;
    const next = handler();
    const started = Date.now();
    const out = await firstValueFrom(
      new IdempotencyInterceptor(redis, logger as never).intercept(
        context('key-12345678'),
        next,
      ),
    );
    expect(out).toEqual({ id: 'e1' });
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('scopes the key to the actual path, so the same key on another plant is a new request', async () => {
    const redis = {
      setIfAbsent: jest.fn().mockResolvedValue(true),
      set: jest.fn().mockResolvedValue(undefined),
    } as unknown as RedisService & { setIfAbsent: jest.Mock };
    await firstValueFrom(
      new IdempotencyInterceptor(redis, logger as never).intercept(
        context('key-12345678'),
        handler(),
      ),
    );
    expect(redis.setIfAbsent.mock.calls[0][0]).toBe(
      'idem:u1:/api/v1/ledger/plants/p1/journal:key-12345678',
    );
  });
});
