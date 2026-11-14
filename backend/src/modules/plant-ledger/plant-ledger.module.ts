import { CatalogueModule } from '../catalogue';
import {
  TREE_CARE_REGISTRY,
  treeCareRegistryProvider,
} from './domain/care/registry';
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
import { PlantEndService } from './services/plant-end.service';
import { GardenPlaceRepository } from './repositories/garden-place.repository';
import { CropPlanService } from './services/crop-plan.service';
import { CropJourneyService } from './services/crop-journey.service';
import { PlantRecordService } from './services/plant-record.service';
import { SeasonalIntelligenceService } from './services/seasonal-intelligence.service';
import { SpeciesNormalizationService } from './services/species-normalization.service';
import { TaskService } from './services/task.service';

@Module({
  imports: [
    CatalogueModule,
    BullModule.registerQueue({ name: TASK_GENERATION_QUEUE }),
  ],
  controllers: [PlantLedgerController],
  providers: [
    treeCareRegistryProvider,
    PlantRepository,
    JournalRepository,
    CycleRepository,
    TaskRepository,
    PlantRecordService,
    PlantEndService,
    GardenPlaceRepository,
    CropPlanService,
    CropJourneyService,
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
    TREE_CARE_REGISTRY,
    GardenPlaceRepository,
    CropPlanService,
    PlantRecordService,
    JournalService,
    CycleService,
    TaskService,
    SeasonalIntelligenceService,
    SpeciesNormalizationService,
  ],
})
export class PlantLedgerModule {}
