import { RegionCluster } from '@prisma/client';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Matching is case-insensitive, so accept either spelling of the enum.
const REGION_CLUSTERS = Object.values(RegionCluster).flatMap((c) => [
  c,
  c.toLowerCase(),
]);

export class ResolvePlantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  query!: string;

  @IsOptional()
  @IsIn(REGION_CLUSTERS)
  region_cluster?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
