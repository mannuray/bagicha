import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { SeasonalService } from './seasonal.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('seasonal')
@UseGuards(AuthGuard('jwt'))
export class SeasonalController {
  constructor(private readonly seasonalService: SeasonalService) {}

  @Get('weather')
  async getWeather(@Request() req) {
    // Uses the user's pincode from their profile
    return this.seasonalService.getLocalizedWeather(req.user.pincode || '800001');
  }

  @Get('guide')
  async getGuide(@Request() req) {
    return this.seasonalService.getSeasonalGuide(req.user.district || 'Patna');
  }
}
