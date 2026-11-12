import { Module } from '@nestjs/common';
import { UserModule } from '../user';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { AppliedPaymentRepository } from './applied-payment.repository';
import { RazorpaySignatureGuard } from './razorpay-signature.guard';

@Module({
  imports: [UserModule],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    AppliedPaymentRepository,
    RazorpaySignatureGuard,
  ],
})
export class SubscriptionModule {}
