import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlantsController],
  providers: [PlantsService],
  exports: [PlantsService],
})
export class PlantsModule {}
