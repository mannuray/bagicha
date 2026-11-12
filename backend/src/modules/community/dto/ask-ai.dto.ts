import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AskAiDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  question: string;

  @IsOptional()
  @IsUUID()
  plant_id?: string;
}
