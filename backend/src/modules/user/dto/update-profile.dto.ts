import { IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsArray()
  @IsIn(['trees', 'veggies', 'flowers'], { each: true })
  garden_types?: string[] | null;

  @IsOptional()
  @IsString()
  language_pref?: string | null;
}
