import { RegionCluster } from '@prisma/client';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { allowedMinutes } from '../reminder-times';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @IsOptional()
  @IsEnum(RegionCluster)
  region_cluster?: RegionCluster | null;

  @IsOptional()
  @IsArray()
  @IsIn(['trees', 'veggies', 'flowers'], { each: true })
  garden_types?: string[] | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language_pref?: string | null;

  /** Key from `POST media/images` with kind=avatar; null removes the photo. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  avatar_key?: string | null;

  /** Minutes after midnight IST on a quarter-hour, 06:00–11:45; null turns the morning reminder off. */
  @IsOptional()
  @IsIn(allowedMinutes('MORNING'))
  reminder_morning_min?: number | null;

  /** Minutes after midnight IST on a quarter-hour, 15:00–21:45; null turns the evening reminder off. */
  @IsOptional()
  @IsIn(allowedMinutes('EVENING'))
  reminder_evening_min?: number | null;
}
