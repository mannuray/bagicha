import { SubscriptionTier, User } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../common/redis/redis.service';
import { TransactionRunner } from '../../common/prisma/transaction';
import { FixedClock } from '../../common/time';
import { AuditService } from '../audit';
import { UserRepository } from '../user';
import { SubscriptionService } from './subscription.service';
import { RazorpayWebhookDto } from './dto/razorpay-webhook.dto';

const NOW = new Date('2026-11-10T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function build(user: Partial<User>) {
  const state = {
    id: 'u1',
    subscription_tier: SubscriptionTier.FREE,
    premium_expires_at: null as Date | null,
    badge_level: 'Seedling',
    ...user,
  };
  const seen = new Set<string>();
  const users = {
    findById: jest.fn(() => Promise.resolve({ ...state })),
    updateSubscription: jest.fn(
      (
        _id: string,
        change: { tier: SubscriptionTier; expiresAt: Date | null },
      ) => {
        state.subscription_tier = change.tier;
        state.premium_expires_at = change.expiresAt;
        return Promise.resolve();
      },
    ),
  };
  const redis = {
    setIfAbsent: jest.fn((key: string) => {
      if (seen.has(key)) return Promise.resolve(false);
      seen.add(key);
      return Promise.resolve(true);
    }),
    del: jest.fn((key: string) => {
      seen.delete(key);
      return Promise.resolve();
    }),
  };
  const audit = { record: jest.fn(() => Promise.resolve()) };
  const transactions = { run: (fn: (tx: unknown) => unknown) => fn('tx') };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const service = new SubscriptionService(
    users as unknown as UserRepository,
    redis as unknown as RedisService,
    audit as unknown as AuditService,
    transactions as unknown as TransactionRunner,
    new FixedClock(NOW),
    { get: () => 'rzp_test' } as any,
    logger as unknown as PinoLogger,
  );
  return { service, state, audit, users };
}

const paid = (planId: string, paymentId = 'pay_1'): RazorpayWebhookDto => ({
  event: 'order.paid',
  payload: {
    payment: {
      entity: { id: paymentId, notes: { user_id: 'u1', plan_id: planId } },
    },
  },
});

describe('SubscriptionService.handleWebhook', () => {
  it('gives a free user 30 days of premium for the monthly plan', async () => {
    const { service, state, audit } = build({});
    await service.handleWebhook(paid('PREMIUM_MONTHLY'));
    expect(state.subscription_tier).toBe(SubscriptionTier.PREMIUM);
    expect(state.premium_expires_at?.getTime()).toBe(NOW.getTime() + 30 * DAY);
    expect(audit.record).toHaveBeenCalledTimes(1);
    expect((audit.record.mock.calls[0] as unknown[])[0]).toMatchObject({
      action: 'SUBSCRIPTION_CHANGED',
      snapshot: {
        before: { tier: 'FREE', expires_at: null },
        after: { tier: 'PREMIUM' },
      },
    });
  });

  it('extends an active subscription from its current expiry', async () => {
    const { service, state } = build({
      subscription_tier: SubscriptionTier.PREMIUM,
      premium_expires_at: new Date(NOW.getTime() + 10 * DAY),
    });
    await service.handleWebhook(paid('PREMIUM_MONTHLY'));
    expect(state.premium_expires_at?.getTime()).toBe(NOW.getTime() + 40 * DAY);
  });

  it('keeps lifetime premium as lifetime', async () => {
    const { service, state } = build({
      subscription_tier: SubscriptionTier.PREMIUM,
      premium_expires_at: null,
    });
    await service.handleWebhook(paid('PREMIUM_YEARLY'));
    expect(state.premium_expires_at).toBeNull();
  });

  it('does not touch badge_level', async () => {
    const { service, state } = build({ badge_level: 'Sprout' });
    await service.handleWebhook(paid('PREMIUM_YEARLY'));
    expect(state.badge_level).toBe('Sprout');
    expect(state.premium_expires_at?.getTime()).toBe(NOW.getTime() + 365 * DAY);
  });

  it('applies a retried delivery of the same payment only once (Review Focus #3)', async () => {
    const { service, state, audit } = build({});
    const first = await service.handleWebhook(paid('PREMIUM_MONTHLY', 'pay_9'));
    const second = await service.handleWebhook(
      paid('PREMIUM_MONTHLY', 'pay_9'),
    );
    expect(first).toEqual({ received: true });
    expect(second).toEqual({ received: true, duplicate: true });
    expect(state.premium_expires_at?.getTime()).toBe(NOW.getTime() + 30 * DAY);
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('ignores events other than order.paid', async () => {
    const { service, users } = build({});
    await service.handleWebhook({
      ...paid('PREMIUM_MONTHLY'),
      event: 'payment.failed',
    });
    expect(users.updateSubscription).not.toHaveBeenCalled();
  });
});
