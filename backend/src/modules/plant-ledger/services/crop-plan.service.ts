import { Injectable } from '@nestjs/common';
import {
  CropStage,
  GrowthHabit,
  Plant,
  RecordKind,
  RecordPattern,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskType,
} from '@prisma/client';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors';
import { TransactionRunner } from '../../../common/prisma/transaction';
import { Clock } from '../../../common/time';
import {
  cropById,
  nextWindow,
  windowContaining,
  type ClimateGroup,
  type CropInfo,
} from '../domain/crop-calendar';
import { PlantRepository } from '../repositories/plant.repository';
import { TaskDraft, TaskService } from './task.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_LEAD_DAYS = 21;

const MATERIAL: Record<string, string> = {
  TUBER: 'seed potatoes',
  CLOVE: 'garlic cloves',
  RHIZOME: 'healthy rhizomes',
};

const later = (a: Date, b: Date) => (a.getTime() >= b.getTime() ? a : b);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Want to grow: a crop the gardener is interested in is a planned crop record,
 * and its seed and sow reminders come from the crop calendar.
 * Spec: docs/superpowers/specs/2026-11-11-vegetables-design.md §2.2, §2.3, §6.1.
 */
@Injectable()
export class CropPlanService {
  constructor(
    private readonly plants: PlantRepository,
    private readonly tasks: TaskService,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
  ) {}

  /** The crop on the user's list (not ended), creating it as PLANNED if new. */
  async add(
    userId: string,
    cropId: string,
  ): Promise<{ plant: Plant; created: boolean }> {
    const crop = cropById(cropId);
    if (!crop) throw new ValidationError('VALIDATION_ERROR', 'Unknown crop');
    const existing = await this.plants.findActiveCrop(userId, crop.id);
    if (existing) return { plant: existing, created: false };
    const plant = await this.plants.create(userId, {
      name: crop.name,
      species: crop.name,
      record_kind: RecordKind.CROP,
      growth_habit: GrowthHabit.ANNUAL,
      record_pattern: RecordPattern.RECURRING_SEASONAL,
      crop_id: crop.id,
      crop_stage: CropStage.PLANNED,
    });
    return { plant, created: true };
  }

  /** Deletes a crop that was never sown (no seasons), with its reminders and notes. */
  async remove(userId: string, plantId: string): Promise<void> {
    await this.transactions.run(async (tx) => {
      const plant = await tx.plant.findFirst({
        where: { id: plantId, user_id: userId, crop_id: { not: null } },
      });
      if (!plant) throw new NotFoundError('PLANT_NOT_FOUND', 'Plant not found');
      if ((await tx.plantCycle.count({ where: { plant_id: plantId } })) > 0) {
        throw new ConflictError(
          'CROP_HAS_SEASONS',
          'This crop has a history; end it instead',
        );
      }
      await tx.task.deleteMany({ where: { plant_id: plantId } });
      await tx.journalEntry.deleteMany({ where: { plant_id: plantId } });
      await tx.plant.delete({ where: { id: plantId } });
    });
  }

  /** Creates the next window's seed and sow reminders for every waiting crop; idempotent. */
  async sync(
    userId: string,
    group: ClimateGroup,
  ): Promise<{ created_count: number }> {
    const now = this.clock.now();
    let created = 0;
    for (const plant of await this.plants.listWaitingCrops(userId)) {
      const crop = cropById(plant.crop_id);
      if (!crop) continue;
      const used = (await this.plants.seasonStarts(plant.id))
        .map((start) => windowContaining(crop, group, start)?.start)
        .filter((d): d is Date => Boolean(d));
      await this.retireClosedReminders(plant.id, now);
      const window = nextWindow(crop, group, now, used);
      if (!window) continue;
      const results = await this.tasks.createTasks(
        userId,
        plant.id,
        this.reminders(crop, plant, window.start, window.end, now),
      );
      created += results.filter((r) => r.status === 'created').length;
    }
    return { created_count: created };
  }

  /** Seed and sow reminders whose window closed unsown are no longer suggested. */
  private async retireClosedReminders(
    plantId: string,
    now: Date,
  ): Promise<void> {
    await this.transactions.run(async (tx) => {
      const pending = await tx.task.findMany({
        where: {
          plant_id: plantId,
          source: TaskSource.CROP_PLAN,
          status: TaskStatus.PENDING,
        },
      });
      const stale = pending
        .filter((t) => {
          const meta = (t.metadata ?? {}) as Record<string, unknown>;
          return (
            (meta.step === 'seeds' || meta.step === 'sow') &&
            typeof meta.window_end === 'string' &&
            new Date(meta.window_end) <= now
          );
        })
        .map((t) => t.id);
      if (stale.length > 0) {
        await tx.task.updateMany({
          where: { id: { in: stale } },
          data: { status: TaskStatus.CANCELLED },
        });
      }
    });
  }

  private reminders(
    crop: CropInfo,
    plant: Plant,
    windowStart: Date,
    windowEnd: Date,
    now: Date,
  ): TaskDraft[] {
    const key = (step: string) =>
      `crop:${plant.id}:${isoDay(windowStart)}:${step}`;
    const material = MATERIAL[crop.method];
    const nursery = crop.method === 'NURSERY_TRANSPLANT';
    return [
      {
        type: TaskType.OBSERVE,
        category: TaskCategory.OBSERVATION,
        priority: TaskPriority.MEDIUM,
        title: material
          ? `Get ${material} for ${crop.name.toLowerCase()}`
          : `Get ${crop.name.toLowerCase()} seeds`,
        source: TaskSource.CROP_PLAN,
        sourceKey: key('seeds'),
        reason: `Sowing season for ${crop.name.toLowerCase()} starts soon in your region.`,
        // TODO(seed-order): link this step to ordering seeds in the app (marketplace module).
        metadata: {
          crop_id: crop.id,
          step: 'seeds',
          window_end: windowEnd.toISOString(),
        },
        dueDate: later(
          now,
          new Date(windowStart.getTime() - SEED_LEAD_DAYS * DAY_MS),
        ),
      },
      {
        type: TaskType.OBSERVE,
        category: TaskCategory.OBSERVATION,
        priority: TaskPriority.HIGH,
        title: material
          ? `Plant ${crop.name.toLowerCase()}`
          : nursery
            ? `Sow ${crop.name.toLowerCase()} in a nursery tray`
            : `Sow ${crop.name.toLowerCase()} in the bed`,
        source: TaskSource.CROP_PLAN,
        sourceKey: key('sow'),
        reason: `It's the right time to sow ${crop.name.toLowerCase()} in your region.`,
        metadata: {
          crop_id: crop.id,
          step: 'sow',
          window_end: windowEnd.toISOString(),
        },
        dueDate: later(now, windowStart),
      },
    ];
  }
}
