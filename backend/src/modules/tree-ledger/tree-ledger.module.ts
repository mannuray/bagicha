import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TreeLedgerService } from './tree-ledger.service';
import { TreeLedgerController } from './tree-ledger.controller';
import { LifecycleService } from './services/lifecycle.service';
import { TaskProcessor } from './processors/task.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'task-generation',
    }),
  ],
  controllers: [TreeLedgerController],
  providers: [TreeLedgerService, LifecycleService, TaskProcessor],
})
export class TreeLedgerModule {}
