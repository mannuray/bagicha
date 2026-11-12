import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddToPlanDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  crop_id: string;
}
