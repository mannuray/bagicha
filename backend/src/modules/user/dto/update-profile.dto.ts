import { RegionCluster } from '@prisma/client';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
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
