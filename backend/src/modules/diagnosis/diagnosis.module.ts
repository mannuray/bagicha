import { Module } from '@nestjs/common';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisPipelineService } from './services/diagnosis-pipeline.service';
import { PlantLedgerModule } from '../plant-ledger/plant-ledger.module';

@Module({
  imports: [PlantLedgerModule],
  controllers: [DiagnosisController],
  providers: [DiagnosisPipelineService],
  exports: [DiagnosisPipelineService],
})
export class DiagnosisModule {}
