import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsISO8601 } from 'class-validator';
import { LogType } from '@prisma/client';

export class AddLogDto {
  @IsNotEmpty()
  @IsEnum(LogType)
  type: LogType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsISO8601()
  event_at?: string;
}
