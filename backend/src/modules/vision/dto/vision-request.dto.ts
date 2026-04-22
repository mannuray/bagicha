import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class VisionRequestDto {
  @IsNotEmpty()
  @IsString()
  image_base64: string; // Base64 encoded image string

  @IsOptional()
  @IsString()
  tree_id?: string; // Optional context for diagnosis
}
