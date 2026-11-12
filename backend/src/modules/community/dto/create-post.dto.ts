import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';

/** posts/<user id>/<uuid>.jpg is well under this. */
const MEDIA_KEY_MAX = 120;

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsUUID()
  plant_id?: string;

  @IsOptional()
  @IsBoolean()
  is_alert?: boolean;

  /** Keys of your own `post` uploads (POST /media/upload); the server builds the URLs. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MaxLength(MEDIA_KEY_MAX, { each: true })
  image_keys?: string[];
}
