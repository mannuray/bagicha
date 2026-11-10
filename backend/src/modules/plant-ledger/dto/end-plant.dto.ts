import { PlantEndReason } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Records that a tree died or was removed. */
export class EndPlantDto {
  @IsEnum(PlantEndReason)
  reason: PlantEndReason;

  @IsOptional()
  @IsISO8601()
  ended_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  /** A journal entry of this plant (typically a diagnosis) that explains the loss. */
  @IsOptional()
  @IsString()
  entry_id?: string;
}
