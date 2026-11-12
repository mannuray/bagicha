import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  MaxLength,
} from 'class-validator';

/** The vision body limit is 8 MB of JSON; base64 can't be longer than that. */
const IMAGE_BASE64_MAX = 8 * 1024 * 1024;

export class VisionRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(IMAGE_BASE64_MAX)
  image_base64: string; // Base64 encoded image string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  plant_id?: string; // Optional context for diagnosis

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsISO8601()
  event_at?: string;
}
