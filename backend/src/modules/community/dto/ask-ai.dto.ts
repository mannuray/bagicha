import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AskAiDto {
  @IsNotEmpty()
  @IsString()
  question: string;

  @IsOptional()
  @IsUUID()
  tree_id?: string;
}
