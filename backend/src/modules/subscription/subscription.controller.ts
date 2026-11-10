import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';

import { RazorpaySignatureGuard } from './razorpay-signature.guard';
import { RazorpayWebhookDto } from './dto/razorpay-webhook.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.subscriptionService.createOrder(req.user.id, dto.plan_id);
  }

  @Post('webhook')
  @UseGuards(RazorpaySignatureGuard)
  async handleWebhook(@Body() payload: RazorpayWebhookDto) {
    return this.subscriptionService.handleWebhook(payload);
  }
}
