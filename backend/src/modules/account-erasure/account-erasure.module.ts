import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MediaModule } from '../media';
import { AccountEraserRepository } from './account-eraser.repository';
import {
  AccountErasureProcessor,
  AccountErasureSchedule,
} from './account-erasure.processor';
import {
  ACCOUNT_ERASURE_QUEUE,
  AccountErasureService,
} from './account-erasure.service';

/** Day 30 of an account deletion: the daily job that erases due accounts. */
@Module({
  imports: [
    MediaModule,
    BullModule.registerQueue({ name: ACCOUNT_ERASURE_QUEUE }),
  ],
  providers: [
    AccountEraserRepository,
    AccountErasureService,
    AccountErasureSchedule,
    AccountErasureProcessor,
  ],
})
export class AccountErasureModule {}
