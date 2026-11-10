import { PlantRepository } from './repositories/plant.repository';
import { JournalRepository } from './repositories/journal.repository';
import { CycleRepository } from './repositories/cycle.repository';
import { TaskRepository } from './repositories/task.repository';
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
    PlantRepository,
    JournalRepository,
    CycleRepository,
    TaskRepository,
    PlantLedgerService,
    LifecycleService,
    SpeciesNormalizationService,
    SeasonalIntelligenceService,
    TaskProcessor,
  ],
  exports: [SeasonalIntelligenceService, SpeciesNormalizationService],
})
export class PlantLedgerModule {}
