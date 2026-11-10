import { Module } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';

@Module({
  controllers: [PlantsController],
  providers: [PlantsService, CatalogRepository],
  exports: [PlantsService],
})
export class PlantsModule {}
