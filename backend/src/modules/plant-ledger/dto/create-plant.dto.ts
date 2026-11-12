import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
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

export class CreatePlantDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  species: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
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
  @MaxLength(40)
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
  @MaxLength(100)
  replaces_id?: string;

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
