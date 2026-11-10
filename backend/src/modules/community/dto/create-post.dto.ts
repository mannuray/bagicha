import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  plant_id?: string;

  @IsOptional()
  @IsBoolean()
  is_alert?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsUrl({}, { each: true })
  image_urls?: string[];
}
