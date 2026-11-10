import { Module } from '@nestjs/common';
import { PlantLedgerModule } from '../plant-ledger';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisRepository } from './repositories/diagnosis.repository';
import { DiagnosisPipelineService } from './services/diagnosis-pipeline.service';

@Module({
  imports: [PlantLedgerModule],
  controllers: [DiagnosisController],
  providers: [DiagnosisRepository, DiagnosisPipelineService],
  exports: [DiagnosisPipelineService],
})
export class DiagnosisModule {}
