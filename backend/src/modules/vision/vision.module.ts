import { Module } from '@nestjs/common';
import { VisionService } from './vision.service';
import { VisionController } from './vision.controller';
import { GeminiService } from './services/gemini.service';
import { TreeLedgerModule } from '../tree-ledger/tree-ledger.module';

@Module({
  imports: [TreeLedgerModule],
  controllers: [VisionController],
  providers: [VisionService, GeminiService],
  exports: [VisionService, GeminiService],
})
export class VisionModule {}
