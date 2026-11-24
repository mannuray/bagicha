import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsISO8601,
  IsNumber,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LogType } from '@prisma/client';

/** Entries only the server writes: ending a tree, and a finalized diagnosis. */
const SYSTEM_LOG_TYPES: readonly LogType[] = [
  LogType.PLANT_ENDED,
  LogType.DIAGNOSIS,
];
export const USER_LOGGABLE: readonly LogType[] = Object.values(LogType).filter(
  (t) => !SYSTEM_LOG_TYPES.includes(t),
);

/** The details a gardener can attach to an entry; nothing else is accepted. */
export class JournalMetadataDto {
  /** Key of the user's own journal upload (POST /media/upload). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  photo_key?: string;

  /** How bad a flower or fruit drop is. */
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  severity?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100_000)
  quantity_value?: number;

  @IsOptional()
  @IsIn(['kg', 'pieces', 'crates'])
  quantity_unit?: string;

  @IsOptional()
  @IsIn(['poor', 'fair', 'good', 'excellent'])
  quality?: string;

  /** How a crop was started (sowing). */
  @IsOptional()
  @IsIn(['NURSERY', 'DIRECT'])
  method?: string;

  /** The bed or pot (the user's own garden place). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  place_id?: string;
}

export class AddLogDto {
  @IsNotEmpty()
  @IsIn(USER_LOGGABLE)
  type: LogType;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => JournalMetadataDto)
  metadata?: JournalMetadataDto;

  @IsOptional()
  @IsISO8601({ strict: true })
  event_at?: string;
}
