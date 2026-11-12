import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import {
  BearingStatus,
  GrowthHabit,
  LifecycleStage,
  PlantingDatePrecision,
  RecordKind,
  RecordPattern,
  TreeType,
} from '@prisma/client';

export class UpdatePlantDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  species?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
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
  @MaxLength(40)
  planting_date?: string | null;

  @IsOptional()
  @IsEnum(PlantingDatePrecision)
  planting_date_precision?: PlantingDatePrecision | null;

  @IsOptional()
  @IsEnum(LifecycleStage)
  lifecycle_stage?: LifecycleStage;

  /** Trees: does it already fruit? Null = not sure. */
  @IsOptional()
  @IsEnum(BearingStatus)
  bearing_status?: BearingStatus | null;

  /** With BEARING: about which year it began fruiting. */
  @IsOptional()
  @IsInt()
  @Min(1900)
  bearing_since_year?: number | null;
}
