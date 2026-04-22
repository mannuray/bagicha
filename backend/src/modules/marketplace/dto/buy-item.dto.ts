import { IsString, IsNotEmpty } from 'class-validator';

export class BuyItemDto {
  @IsNotEmpty()
  @IsString()
  item_id: string;
}
