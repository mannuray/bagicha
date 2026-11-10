import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.subscriptionService.createOrder(req.user.id, dto.plan_id);
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.subscriptionService.handleWebhook(payload);
  }
}
