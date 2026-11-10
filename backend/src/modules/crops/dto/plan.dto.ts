import { IsNotEmpty, IsString } from 'class-validator';

export class AddToPlanDto {
  @IsNotEmpty()
  @IsString()
  crop_id: string;
}
