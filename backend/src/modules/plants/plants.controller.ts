import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PlantsService } from './plants.service';

@Controller('plants')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    return this.plantsService.search(query || '');
  }

  @Post('resolve')
  async resolve(
    @Body()
    body: {
      query: string;
      region_cluster?: string;
      language?: string;
    },
  ) {
    return this.plantsService.resolve(body.query || '', body.region_cluster, body.language);
  }
}
