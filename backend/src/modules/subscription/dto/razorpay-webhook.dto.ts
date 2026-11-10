import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class RazorpayNotesDto {
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @IsOptional()
  @IsString()
  plan_id?: string;
}

class RazorpayPaymentEntityDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => RazorpayNotesDto)
  notes!: RazorpayNotesDto;
}

class RazorpayPaymentDto {
  @IsObject()
  @ValidateNested()
  @Type(() => RazorpayPaymentEntityDto)
  entity!: RazorpayPaymentEntityDto;
}

class RazorpayPayloadDto {
  @IsObject()
  @ValidateNested()
  @Type(() => RazorpayPaymentDto)
  payment!: RazorpayPaymentDto;
}

export class RazorpayWebhookDto {
  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => RazorpayPayloadDto)
  payload!: RazorpayPayloadDto;
}
