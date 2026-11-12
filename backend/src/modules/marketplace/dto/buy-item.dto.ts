import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class BuyItemDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  item_id: string;
}
