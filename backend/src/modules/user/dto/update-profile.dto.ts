import { RegionCluster } from '@prisma/client';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @IsString()
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
  language_pref?: string | null;

  /** Key from `POST media/images` with kind=avatar; null removes the photo. */
  @IsOptional()
  @IsString()
  avatar_key?: string | null;
}
