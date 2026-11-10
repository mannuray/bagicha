import { Module } from '@nestjs/common';
import { UserModule } from '../user';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { RazorpaySignatureGuard } from './razorpay-signature.guard';

@Module({
  imports: [UserModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, RazorpaySignatureGuard],
})
export class SubscriptionModule {}
