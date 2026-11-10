import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

import { RazorpayWebhookDto } from './dto/razorpay-webhook.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectPinoLogger(SubscriptionService.name)
    private readonly logger: PinoLogger,
  ) {}

  async createOrder(userId: string, planId: string) {
    // Mock Razorpay Order Creation
    const orderId = `order_${Math.random().toString(36).substring(7)}`;

    this.logger.info(
      { orderId, userId, planId },
      'Creating mock Razorpay order',
    );

    return {
      order_id: orderId,
      amount: planId === 'PREMIUM_MONTHLY' ? 29900 : 299900, // in paise
      currency: 'INR',
      key_id: this.configService.get<string>(
        'RAZORPAY_KEY_ID',
        'rzp_test_mock',
      ),
    };
  }

  async handleWebhook(payload: RazorpayWebhookDto) {
    if (payload.event === 'order.paid') {
      const userId = payload.payload.payment.entity.notes.user_id;
      this.logger.info({ userId }, 'Razorpay payment confirmed');

      // Update user status to Premium
      await this.prisma.user.update({
        where: { id: userId },
        data: { badge_level: 'Rooted' }, // Just an example upgrade
      });
    }

    return { received: true };
  }
}
