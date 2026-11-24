import type { FinalizeDiagnosisInput } from '../services/diagnosis-pipeline.service';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DiagnosisIssueType,
  DiagnosisSeverity,
  DiagnosisSubjectType,
  LogType,
} from '@prisma/client';

/** A photo or file the diagnosis was made from (a description, never the bytes). */
export class DiagnosisAttachmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  kind: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}

/** One turn of the conversation that led to the diagnosis. */
export class DiagnosisMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(2000)
  content: string;
}

export class FinalizeDiagnosisDto implements FinalizeDiagnosisInput {
  @IsEnum(DiagnosisSubjectType)
  subject_type!: DiagnosisSubjectType;

  @IsString()
  @MaxLength(100)
  subject_id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  session_id?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  event_at?: string;

  @IsEnum(DiagnosisIssueType)
  primary_issue!: DiagnosisIssueType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  secondary_issues?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  symptoms?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  affected_part?: string;

  @IsEnum(DiagnosisSeverity)
  severity!: DiagnosisSeverity;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  confidence?: string;

  @IsString()
  @MaxLength(2000)
  reasoning_summary!: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  recommended_actions!: string[];

  @IsOptional()
  @IsBoolean()
  needs_follow_up?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  follow_up_days?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  user_note?: string;

  @IsOptional()
  @IsEnum(LogType)
  related_event_type?: LogType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => DiagnosisAttachmentDto)
  attachments?: DiagnosisAttachmentDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DiagnosisMessageDto)
  messages?: DiagnosisMessageDto[];
}
