import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { BuyItemDto } from './dto/buy-item.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('marketplace')
@UseGuards(AuthGuard('jwt'))
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('items')
  getItems() {
    return this.marketplaceService.getItems();
  }

  @Post('buy')
  buyItem(@Request() req: { user: { id: string } }, @Body() dto: BuyItemDto) {
    return this.marketplaceService.buyItem(req.user.id, dto.item_id);
  }
}
