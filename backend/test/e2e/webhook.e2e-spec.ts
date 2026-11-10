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

  const payloadFor = (userId: string, paymentId = 'pay_1') =>
    JSON.stringify({
      event: 'order.paid',
      payload: {
        payment: {
          entity: {
            id: paymentId,
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
    expect((await reload()).badge_level).toBe('Seedling');
  });

  it('rejects a bad signature', async () => {
    const res = await post(payloadFor(user.id), 'deadbeef');
    expect(res.status).toBe(401);
    expect((await reload()).badge_level).toBe('Seedling');
  });

  it('upgrades the user on a correctly signed payment', async () => {
    const raw = payloadFor(user.id);
    const res = await post(raw, sign(raw));
    expect(res.status).toBe(201);
    expect((await reload()).badge_level).toBe('Rooted');
  });
});
