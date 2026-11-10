import { Module } from '@nestjs/common';
import { VisionService } from './vision.service';
import { VisionController } from './vision.controller';
import { AiModule } from '../ai';
import { PlantLedgerModule } from '../plant-ledger';
import { DiagnosisModule } from '../diagnosis';

@Module({
  imports: [AiModule, PlantLedgerModule, DiagnosisModule],
  controllers: [VisionController],
  providers: [VisionService],
  exports: [VisionService],
})
export class VisionModule {}
