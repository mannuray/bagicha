import { IsPhoneNumber, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone_number: string;
}
