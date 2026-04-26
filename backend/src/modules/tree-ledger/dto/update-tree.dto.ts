import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GrowthHabit, LifecycleStage, PlantingDatePrecision, RecordKind, RecordPattern, TreeType } from '@prisma/client';

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
  @IsEnum(RecordKind)
  record_kind?: RecordKind;

  @IsOptional()
  @IsEnum(GrowthHabit)
  growth_habit?: GrowthHabit;

  @IsOptional()
  @IsEnum(RecordPattern)
  record_pattern?: RecordPattern;

  @IsOptional()
  @IsString()
  planting_date?: string | null;

  @IsOptional()
  @IsEnum(PlantingDatePrecision)
  planting_date_precision?: PlantingDatePrecision | null;

  @IsOptional()
  @IsEnum(LifecycleStage)
  lifecycle_stage?: LifecycleStage;
}
