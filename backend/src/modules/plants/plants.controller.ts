import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RateLimit } from '../../common/rate-limit';
import { ResolvePlantDto } from './dto/resolve-plant.dto';
import { SearchPlantsDto } from './dto/search-plants.dto';
import { PlantsService } from './plants.service';

/** Public plant catalogue (used during onboarding, before or around sign-in). */
@Controller('plants')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Get('search')
  @RateLimit('catalogue')
  search(@Query() q: SearchPlantsDto) {
    return this.plantsService.search(q.q ?? '', q);
  }

  @Post('resolve')
  @RateLimit('catalogue')
  resolve(@Body() body: ResolvePlantDto) {
    return this.plantsService.resolve(
      body.query,
      body.region_cluster,
      body.language,
    );
  }
}
