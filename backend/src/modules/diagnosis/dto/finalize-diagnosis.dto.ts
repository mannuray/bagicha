import type { FinalizeDiagnosisInput } from '../services/diagnosis-pipeline.service';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DiagnosisIssueType,
  DiagnosisSeverity,
  DiagnosisSubjectType,
  LogType,
} from '@prisma/client';

export class FinalizeDiagnosisDto implements FinalizeDiagnosisInput {
  @IsEnum(DiagnosisSubjectType)
  subject_type!: DiagnosisSubjectType;

  @IsString()
  subject_id!: string;

  @IsOptional()
  @IsString()
  session_id?: string;

  @IsOptional()
  @IsISO8601()
  event_at?: string;

  @IsEnum(DiagnosisIssueType)
  primary_issue!: DiagnosisIssueType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondary_issues?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsString()
  affected_part?: string;

  @IsEnum(DiagnosisSeverity)
  severity!: DiagnosisSeverity;

  @IsOptional()
  @IsString()
  confidence?: string;

  @IsString()
  reasoning_summary!: string;

  @IsArray()
  @IsString({ each: true })
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
  user_note?: string;

  @IsOptional()
  @IsEnum(LogType)
  related_event_type?: LogType;

  @IsOptional()
  @IsArray()
  attachments?: Array<Record<string, unknown>>;

  @IsOptional()
  messages?: Array<Record<string, unknown>>;
}
