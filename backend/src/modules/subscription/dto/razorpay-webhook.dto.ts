import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

/** Envelope every Razorpay event shares; the payload shape depends on the event. */
export class RazorpayWebhookDto {
  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

class RazorpayNotesDto {
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @IsOptional()
  @IsString()
  plan_id?: string;
}

class PaymentEntityDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsIn(['INR'])
  currency!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RazorpayNotesDto)
  notes?: RazorpayNotesDto;
}

class OrderEntityDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RazorpayNotesDto)
  notes?: RazorpayNotesDto;
}

class PaymentWrapperDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentEntityDto)
  entity!: PaymentEntityDto;
}

class OrderWrapperDto {
  @IsObject()
  @ValidateNested()
  @Type(() => OrderEntityDto)
  entity!: OrderEntityDto;
}

/** `order.paid` payload: the payment, and (when present) the server-created order. */
export class OrderPaidPayloadDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentWrapperDto)
  payment!: PaymentWrapperDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OrderWrapperDto)
  order?: OrderWrapperDto;
}
