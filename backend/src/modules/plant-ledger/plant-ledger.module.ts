import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PlantLedgerController } from './plant-ledger.controller';
import {
  TASK_GENERATION_QUEUE,
  TaskProcessor,
} from './processors/task.processor';
import { CycleRepository } from './repositories/cycle.repository';
import { JournalRepository } from './repositories/journal.repository';
import { PlantRepository } from './repositories/plant.repository';
import { TaskRepository } from './repositories/task.repository';
import { CycleService } from './services/cycle.service';
import { JournalService } from './services/journal.service';
import { LifecycleService } from './services/lifecycle.service';
import { MitigationService } from './services/mitigation.service';
import { PlantRecordService } from './services/plant-record.service';
import { SeasonalIntelligenceService } from './services/seasonal-intelligence.service';
import { SpeciesNormalizationService } from './services/species-normalization.service';
import { TaskService } from './services/task.service';

@Module({
  imports: [BullModule.registerQueue({ name: TASK_GENERATION_QUEUE })],
  controllers: [PlantLedgerController],
  providers: [
    PlantRepository,
    JournalRepository,
    CycleRepository,
    TaskRepository,
    PlantRecordService,
    JournalService,
    CycleService,
    TaskService,
    MitigationService,
    LifecycleService,
    SpeciesNormalizationService,
    SeasonalIntelligenceService,
    TaskProcessor,
  ],
  exports: [
    PlantRecordService,
    JournalService,
    CycleService,
    TaskService,
    SeasonalIntelligenceService,
    SpeciesNormalizationService,
  ],
})
export class PlantLedgerModule {}
