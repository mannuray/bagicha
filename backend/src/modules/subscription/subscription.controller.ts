import type { AuthedRequest } from '../../common/auth/authed-request';
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';

import { RazorpaySignatureGuard } from './razorpay-signature.guard';
import { RazorpayWebhookDto } from './dto/razorpay-webhook.dto';
import { RazorpayWebhookBodyPipe } from './webhook-body.pipe';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  createOrder(@Request() req: AuthedRequest, @Body() dto: CreateOrderDto) {
    return this.subscriptionService.createOrder(req.user.id, dto.plan_id);
  }

  @Post('webhook')
  @UseGuards(RazorpaySignatureGuard)
  async handleWebhook(@Body(RazorpayWebhookBodyPipe) payload: unknown) {
    return this.subscriptionService.handleWebhook(
      payload as RazorpayWebhookDto,
    );
  }
}
