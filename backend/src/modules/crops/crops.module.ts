import { Module } from '@nestjs/common';
import { PlantLedgerModule } from '../plant-ledger';
import { CropsController } from './crops.controller';
import { CropsService } from './crops.service';

/** Vegetables: crop calendar, want to grow, reminders and garden places. */
@Module({
  imports: [PlantLedgerModule],
  controllers: [CropsController],
  providers: [CropsService],
})
export class CropsModule {}
