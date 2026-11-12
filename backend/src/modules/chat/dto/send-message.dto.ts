import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsUUID()
  receiver_id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsUUID()
  shared_resource_id?: string;
}
