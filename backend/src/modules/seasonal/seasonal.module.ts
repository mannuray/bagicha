import { CatalogueModule } from '../catalogue';
import { Module } from '@nestjs/common';
import { PlantLedgerModule } from '../plant-ledger';
import { UserModule } from '../user';
import { OverlayRepository } from './repositories/overlay.repository';
import { SeasonalPackRepository } from './repositories/seasonal-pack.repository';
import { SeasonalController } from './seasonal.controller';
import { SeasonalService } from './seasonal.service';
import { TreeIntelligenceService } from './services/tree-intelligence.service';
import { TreeTaskMaterializer } from './services/tree-task-materializer.service';

@Module({
  imports: [CatalogueModule, PlantLedgerModule, UserModule],
  controllers: [SeasonalController],
  providers: [
    SeasonalService,
    TreeIntelligenceService,
    TreeTaskMaterializer,
    SeasonalPackRepository,
    OverlayRepository,
  ],
  exports: [SeasonalService],
})
export class SeasonalModule {}
