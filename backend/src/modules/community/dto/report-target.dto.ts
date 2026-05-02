import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReportTargetDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}
