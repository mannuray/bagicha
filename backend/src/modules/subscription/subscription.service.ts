import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionTier, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  InvariantError,
  NotFoundError,
  ValidationError,
} from '../../common/errors';
import { TransactionRunner } from '../../common/prisma/transaction';
import { RedisService } from '../../common/redis/redis.service';
import { addDays, Clock } from '../../common/time';
import { AuditAction, AuditService } from '../audit';
import { UserRepository } from '../user';
import {
  OrderPaidPayloadDto,
  RazorpayWebhookDto,
} from './dto/razorpay-webhook.dto';
import { isPlanId, PLANS, PlanId } from './plans';

const WEBHOOK_DEDUPE_TTL_SECONDS = 7 * 24 * 60 * 60;

const snapshotOf = (
  u: Pick<User, 'subscription_tier' | 'premium_expires_at'>,
) => ({
  tier: u.subscription_tier,
  expires_at: u.premium_expires_at?.toISOString() ?? null,
});

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly users: UserRepository,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
    private readonly config: ConfigService,
    @InjectPinoLogger(SubscriptionService.name)
    private readonly logger: PinoLogger,
  ) {}

  /** Mock Razorpay order. Notes carry what the webhook needs to apply the purchase. */
  createOrder(userId: string, planId: PlanId) {
    const orderId = `order_${randomUUID().replace(/-/g, '').slice(0, 14)}`;
    this.logger.info(
      { orderId, userId, planId },
      'Creating mock Razorpay order',
    );
    return {
      order_id: orderId,
      amount: PLANS[planId].amountPaise,
      currency: 'INR',
      key_id: this.config.get<string>('RAZORPAY_KEY_ID', 'rzp_test_mock'),
      notes: { user_id: userId, plan_id: planId },
    };
  }

  /** Applies a verified `order.paid` once per payment id, however often Razorpay retries. */
  async handleWebhook(
    payload: RazorpayWebhookDto,
  ): Promise<{ received: true; duplicate?: true }> {
    if (payload.event !== 'order.paid') return { received: true };

    const paid = plainToInstance(OrderPaidPayloadDto, payload.payload);
    const problems = validateSync(paid);
    if (problems.length > 0) {
      throw new ValidationError(
        'WEBHOOK_PAYLOAD_INVALID',
        'order.paid payload is missing required fields',
      );
    }
    const payment = paid.payment.entity;
    // Order notes are set by our server when the order is created; payment notes can come from the client.
    const notes = paid.order?.entity.notes ?? payment.notes;
    if (!notes) {
      throw new ValidationError(
        'WEBHOOK_PAYLOAD_INVALID',
        'order.paid has no notes',
      );
    }

    const dedupeKey = `webhook:razorpay:${payment.id}`;
    const firstDelivery = await this.redis.setIfAbsent(
      dedupeKey,
      '1',
      WEBHOOK_DEDUPE_TTL_SECONDS,
    );
    if (!firstDelivery) {
      this.logger.info(
        { paymentId: payment.id },
        'Duplicate Razorpay delivery ignored',
      );
      return { received: true, duplicate: true };
    }

    try {
      await this.applyPurchase(notes.user_id, notes.plan_id, payment);
    } catch (err) {
      // Let Razorpay's retry apply it (and keep alerting until someone looks).
      await this.redis.del(dedupeKey);
      throw err;
    }
    return { received: true };
  }

  private async applyPurchase(
    userId: string,
    planIdRaw: string | undefined,
    payment: { id: string; amount: number; currency: string },
  ): Promise<void> {
    const paymentId = payment.id;
    if (!isPlanId(planIdRaw)) {
      // Money was taken for something we can't fulfil: a bug, not bad input.
      throw new InvariantError('Paid order has no known plan', {
        paymentId,
        planId: planIdRaw ?? null,
      });
    }
    const plan = PLANS[planIdRaw];
    if (payment.amount !== plan.amountPaise) {
      this.logger.error(
        {
          paymentId,
          planId: planIdRaw,
          paid: payment.amount,
          expected: plan.amountPaise,
        },
        'Paid amount does not match the plan; not applying',
      );
      return;
    }

    await this.transactions.run(async (tx) => {
      const user = await this.users.findById(userId, tx);
      if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');

      const now = this.clock.now();
      const lifetime =
        user.subscription_tier === SubscriptionTier.PREMIUM &&
        user.premium_expires_at === null;
      const from =
        user.premium_expires_at && user.premium_expires_at > now
          ? user.premium_expires_at
          : now;
      const after = {
        subscription_tier: SubscriptionTier.PREMIUM,
        premium_expires_at: lifetime ? null : addDays(from, plan.days),
      };

      await this.users.updateSubscription(
        userId,
        { tier: after.subscription_tier, expiresAt: after.premium_expires_at },
        tx,
      );
      await this.audit.record(
        {
          actorUserId: userId,
          action: AuditAction.SUBSCRIPTION_CHANGED,
          targetType: 'user',
          targetId: userId,
          snapshot: {
            payment_id: paymentId,
            plan_id: planIdRaw,
            before: snapshotOf(user),
            after: snapshotOf(after),
          },
        },
        tx,
      );
    });
    this.logger.info({ userId, paymentId }, 'Premium applied');
  }
}
