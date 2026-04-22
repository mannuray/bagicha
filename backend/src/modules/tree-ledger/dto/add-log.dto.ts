import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
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
}
