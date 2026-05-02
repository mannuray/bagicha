import { IsString, IsNotEmpty, IsOptional, IsISO8601 } from 'class-validator';

export class VisionRequestDto {
  @IsNotEmpty()
  @IsString()
  image_base64: string; // Base64 encoded image string

  @IsOptional()
  @IsString()
  plant_id?: string; // Optional context for diagnosis

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsISO8601()
  event_at?: string;
}
