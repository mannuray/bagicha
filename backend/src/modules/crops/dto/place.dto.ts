import { GardenPlaceKind } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePlaceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  name: string;

  @IsEnum(GardenPlaceKind)
  kind: GardenPlaceKind;
}

export class UpdatePlaceDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(GardenPlaceKind)
  kind?: GardenPlaceKind;

  /** True archives the place (it stays on past seasons); false brings it back. */
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
