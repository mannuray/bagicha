import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { createHmac } from 'crypto';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedUser } from './fixtures';

describe('Razorpay webhook', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let user: User;

  const payloadFor = (userId: string, paymentId = `pay_${Date.now()}`) =>
    JSON.stringify({
      // Razorpay sends many fields we don't use; they must not be rejected.
      entity: 'event',
      account_id: 'acc_test',
      contains: ['payment', 'order'],
      created_at: 1700000000,
      event: 'order.paid',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            entity: 'payment',
            status: 'captured',
            method: 'upi',
            amount: 29900,
            currency: 'INR',
            notes: { user_id: userId, plan_id: 'PREMIUM_MONTHLY' },
          },
        },
      },
    });
  const sign = (raw: string) =>
    createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(raw)
      .digest('hex');
  const post = (raw: string, signature?: string) => {
    const req = request(app.getHttpServer())
      .post('/api/v1/subscription/webhook')
      .set('Content-Type', 'application/json');
    if (signature) req.set('X-Razorpay-Signature', signature);
    return req.send(raw);
  };
  const reload = () =>
    prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    user = await seedUser(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a request with no signature and does not upgrade', async () => {
    const res = await post(payloadFor(user.id));
    expect(res.status).toBe(401);
    expect((await reload()).subscription_tier).toBe('FREE');
  });

  it('rejects a bad signature', async () => {
    const res = await post(payloadFor(user.id), 'deadbeef');
    expect(res.status).toBe(401);
    expect((await reload()).subscription_tier).toBe('FREE');
  });

  it('upgrades the user on a correctly signed payment', async () => {
    const raw = payloadFor(user.id);
    const res = await post(raw, sign(raw));
    expect(res.status).toBe(201);
    const after = await reload();
    expect(after.subscription_tier).toBe('PREMIUM');
    expect(after.premium_expires_at).not.toBeNull();
    expect(after.badge_level).toBe('Seedling');
  });

  it('acknowledges other signed events without requiring an order payload', async () => {
    const raw = JSON.stringify({
      event: 'payment.authorized',
      payload: { payment: { entity: { id: 'pay_z' } } },
    });
    const res = await post(raw, sign(raw));
    expect(res.status).toBe(201);
    expect((await reload()).subscription_tier).toBe('FREE');
  });
});
