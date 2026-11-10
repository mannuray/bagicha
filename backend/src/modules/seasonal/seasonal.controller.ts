import type { AuthedRequest } from '../../common/auth/authed-request';
import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Post,
} from '@nestjs/common';
import { SeasonalService } from './seasonal.service';
import { AuthGuard } from '@nestjs/passport';

// Users have no pincode yet, so weather has always used this default.
const DEFAULT_PINCODE = '800001';
const DEFAULT_DISTRICT = 'Patna';

@Controller('seasonal')
@UseGuards(AuthGuard('jwt'))
export class SeasonalController {
  constructor(private readonly seasonalService: SeasonalService) {}

  @Get('weather')
  getWeather() {
    return this.seasonalService.getLocalizedWeather(DEFAULT_PINCODE);
  }

  @Get('guide')
  getGuide(@Request() req: AuthedRequest) {
    return this.seasonalService.getSeasonalGuide({
      ...req.user,
      district: req.user.district || DEFAULT_DISTRICT,
    });
  }

  @Get('plant/:id/intelligence')
  async getTreeIntelligence(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
  ) {
    return this.seasonalService.getTreeIntelligence(req.user.id, id);
  }

  @Post('plant/:id/materialize-tasks')
  async materializeTasks(
    @Request() req: AuthedRequest,
    @Param('id') id: string,
  ) {
    return this.seasonalService.materializeTasksForTree(req.user.id, id);
  }
}
