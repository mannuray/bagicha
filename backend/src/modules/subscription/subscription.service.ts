import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createOrder(userId: string, planId: string) {
    // Mock Razorpay Order Creation
    const orderId = `order_${Math.random().toString(36).substring(7)}`;
    
    console.log(`[SUBSCRIPTION] Creating Razorpay order ${orderId} for user ${userId}, plan ${planId}`);

    return {
      order_id: orderId,
      amount: planId === 'PREMIUM_MONTHLY' ? 29900 : 299900, // in paise
      currency: 'INR',
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID', 'rzp_test_mock'),
    };
  }

  async handleWebhook(payload: any) {
    const { event, payload: data } = payload;

    if (event === 'order.paid') {
      const userId = data.payment.entity.notes.user_id;
      console.log(`[WEBHOOK] Payment successful for user ${userId}`);
      
      // Update user status to Premium
      await this.prisma.user.update({
        where: { id: userId },
        data: { badge_level: 'Rooted' }, // Just an example upgrade
      });
    }

    return { received: true };
  }
}
