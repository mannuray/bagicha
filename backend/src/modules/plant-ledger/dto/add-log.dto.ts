import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsISO8601,
  MaxLength,
} from 'class-validator';
import { LogType } from '@prisma/client';

export class AddLogDto {
  @IsNotEmpty()
  @IsEnum(LogType)
  type: LogType;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsISO8601()
  event_at?: string;
}
