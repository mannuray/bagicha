import { Injectable } from '@nestjs/common';
import { LogType, Plant } from '@prisma/client';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors';
import { TransactionRunner } from '../../../common/prisma/transaction';
import { Clock } from '../../../common/time';
import { EndPlantDto } from '../dto/end-plant.dto';
import { JournalRepository } from '../repositories/journal.repository';
import { PlantRepository } from '../repositories/plant.repository';
import { TaskRepository } from '../repositories/task.repository';
import { PlantRecordService } from './plant-record.service';

/**
 * When a tree dies or is removed. Nothing is deleted: the plant keeps its record,
 * stops growing it (no tasks, no new entries) and can be restored.
 */
@Injectable()
export class PlantEndService {
  constructor(
    private readonly plants: PlantRecordService,
    private readonly plantRows: PlantRepository,
    private readonly journal: JournalRepository,
    private readonly tasks: TaskRepository,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  async end(userId: string, plantId: string, dto: EndPlantDto): Promise<Plant> {
    const plant = await this.plants.assertGrowing(userId, plantId);
    const now = this.clock.now();
    const endedAt = dto.ended_at ? new Date(dto.ended_at) : now;
    if (endedAt.getTime() > now.getTime()) {
      throw new ValidationError(
        'VALIDATION_ERROR',
        'The end date cannot be in the future',
      );
    }
    if (
      plant.planting_date &&
      endedAt.getTime() < plant.planting_date.getTime()
    ) {
      throw new ValidationError(
        'VALIDATION_ERROR',
        'The end date cannot be before the planting date',
      );
    }
    return this.transactions.run(async (tx) => {
      if (dto.entry_id) {
        const entry = await this.journal.findInPlant(dto.entry_id, plantId, tx);
        if (!entry)
          throw new NotFoundError(
            'JOURNAL_ENTRY_NOT_FOUND',
            'That entry is not part of this tree',
          );
      }
      await this.journal.createEntry(
        {
          plant_id: plantId,
          type: LogType.PLANT_ENDED,
          content: dto.note ?? null,
          metadata: { reason: dto.reason },
          timestamp: endedAt,
          recorded_at: now,
        },
        tx,
      );
      await this.tasks.cancelPending(plantId, {}, tx);
      return this.plantRows.markEnded(
        plantId,
        {
          ended_at: endedAt,
          end_reason: dto.reason,
          end_note: dto.note ?? null,
          end_entry_id: dto.entry_id ?? null,
        },
        tx,
      );
    });
  }

  async restore(userId: string, plantId: string): Promise<Plant> {
    const plant = await this.plants.getOwnedOrThrow(userId, plantId);
    if (!plant.ended_at)
      throw new ConflictError('PLANT_NOT_ENDED', 'This tree has not ended');
    const now = this.clock.now();
    return this.transactions.run(async (tx) => {
      await this.journal.createEntry(
        {
          plant_id: plantId,
          type: LogType.NOTE,
          content: 'Restored',
          timestamp: now,
          recorded_at: now,
        },
        tx,
      );
      return this.plantRows.clearEnded(plantId, tx);
    });
  }
}
