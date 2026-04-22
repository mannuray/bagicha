import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { LifecycleStage, TreeType } from '@prisma/client';

export class UpdateTreeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  variety?: string | null;

  @IsOptional()
  @IsEnum(TreeType)
  type?: TreeType;

  @IsOptional()
  @IsDateString()
  planting_date?: string | null;

  @IsOptional()
  @IsEnum(LifecycleStage)
  lifecycle_stage?: LifecycleStage;
}
