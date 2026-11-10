import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import {
  GrowthHabit,
  LifecycleStage,
  PlantingDatePrecision,
  RecordKind,
  RecordPattern,
  TreeType,
} from '@prisma/client';

export class CreatePlantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  species: string;

  @IsOptional()
  @IsString()
  variety?: string;

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
  planting_date?: string;

  @IsOptional()
  @IsEnum(PlantingDatePrecision)
  planting_date_precision?: PlantingDatePrecision;

  @IsOptional()
  @IsEnum(LifecycleStage)
  lifecycle_stage?: LifecycleStage;

  /** An ended plant this one replaces; links the two records. */
  @IsOptional()
  @IsString()
  replaces_id?: string;
}
