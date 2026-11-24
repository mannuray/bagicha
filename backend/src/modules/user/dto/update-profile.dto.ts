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
}
