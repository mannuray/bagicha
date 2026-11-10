import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PlantLedgerService } from './plant-ledger.service';
import { PlantLedgerController } from './plant-ledger.controller';
import { LifecycleService } from './services/lifecycle.service';
import { SpeciesNormalizationService } from './services/species-normalization.service';
import { TaskProcessor } from './processors/task.processor';
import { SeasonalIntelligenceService } from './services/seasonal-intelligence.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'task-generation',
    }),
  ],
  controllers: [PlantLedgerController],
  providers: [
    PlantLedgerService,
    LifecycleService,
    SpeciesNormalizationService,
    SeasonalIntelligenceService,
    TaskProcessor,
  ],
  exports: [SeasonalIntelligenceService, SpeciesNormalizationService],
})
export class PlantLedgerModule {}
