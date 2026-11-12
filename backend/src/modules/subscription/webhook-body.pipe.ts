import { Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RazorpayWebhookDto } from './dto/razorpay-webhook.dto';
import { ValidationError } from '../../common/errors';

/**
 * Validates a Razorpay webhook body against the fields we use, ignoring the rest:
 * Razorpay sends many fields we don't model, so the global "reject unknown fields"
 * rule can't apply here. (The handler's parameter is typed `unknown`, so the global
 * pipe leaves it to this one.)
 */
@Injectable()
export class RazorpayWebhookBodyPipe implements PipeTransform<
  unknown,
  Promise<RazorpayWebhookDto>
> {
  async transform(value: unknown): Promise<RazorpayWebhookDto> {
    const dto = plainToInstance(RazorpayWebhookDto, value);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    if (errors.length > 0)
      throw new ValidationError(
        'WEBHOOK_PAYLOAD_INVALID',
        'Webhook payload is malformed',
      );
    return dto;
  }
}
