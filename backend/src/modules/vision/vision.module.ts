import { Module } from '@nestjs/common';
import { VisionService } from './vision.service';
import { VisionController } from './vision.controller';
import { GeminiService } from './services/gemini.service';
import { PlantLedgerModule } from '../plant-ledger/plant-ledger.module';
import { DiagnosisModule } from '../diagnosis/diagnosis.module';

@Module({
  imports: [PlantLedgerModule, DiagnosisModule],
  controllers: [VisionController],
  providers: [VisionService, GeminiService],
  exports: [VisionService, GeminiService],
})
export class VisionModule {}
