import { Injectable } from '@nestjs/common';
import {
  CropStage,
  GrowthHabit,
  Plant,
  RecordKind,
  RecordPattern,
  Task,
  TaskCategory,
  TaskPriority,
  TaskSource,
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
  CatalogueStore,
  type ClimateGroup,
  type CropInfo,
  type PlantingMethod,
} from '../../catalogue';
import {
  nextWindow,
  windowContaining,
  titleName,
} from '../domain/crop-calendar';
import { fillCropTitle, type CropTitleKey } from '../domain/task-titles';
import { PlantRepository } from '../repositories/plant.repository';
import { CycleRepository } from '../repositories/cycle.repository';
import { JournalRepository } from '../repositories/journal.repository';
import { TaskRepository } from '../repositories/task.repository';
import { TaskDraft, TaskService } from './task.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const SEED_LEAD_DAYS = 21;

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
    private readonly cycles: CycleRepository,
    private readonly journal: JournalRepository,
    private readonly taskRows: TaskRepository,
    private readonly tasks: TaskService,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
    private readonly catalogue: CatalogueStore,
  ) {}

  /** The crop on the user's list (not ended), creating it as PLANNED if new. */
  async add(
    userId: string,
    cropId: string,
  ): Promise<{ plant: Plant; created: boolean }> {
    // Only listed crops can be newly added; a retired one stays with those who grow it.
    const crop = (await this.catalogue.snapshot()).listedCrop(cropId);
    if (!crop) throw new ValidationError('VALIDATION_ERROR', 'Unknown crop');
    const existing = await this.plants.findActiveCrop(userId, crop.id);
    if (existing) return { plant: existing, created: false };
    const plant = await this.plants.create(userId, {
      name: crop.name,
      species: crop.name,
      record_kind: crop.kind === 'FLOWER' ? RecordKind.FLOWER : RecordKind.CROP,
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
      const plant = await this.plants.findOwnedCrop(userId, plantId, tx);
      if (!plant) throw new NotFoundError('PLANT_NOT_FOUND', 'Plant not found');
      if ((await this.cycles.countFor(plantId, tx)) > 0) {
        throw new ConflictError(
          'CROP_HAS_SEASONS',
          'This crop has a history; end it instead',
        );
      }
      await this.taskRows.deleteForPlant(plantId, tx);
      await this.journal.deleteForPlant(plantId, tx);
      await this.plants.delete(plantId, tx);
    });
  }

  /**
   * Creates the next window's seed and sow reminders for every waiting crop;
   * idempotent. Runs once a dashboard session, so it reads seasons and pending
   * reminders for all crops at once and writes only what is new.
   */
  async sync(
    userId: string,
    group: ClimateGroup,
  ): Promise<{ created_count: number }> {
    const now = this.clock.now();
    const catalogue = await this.catalogue.snapshot();
    const waiting = (await this.plants.listWaitingCrops(userId)).filter(
      (plant) => catalogue.crop(plant.crop_id),
    );
    const ids = waiting.map((p) => p.id);
    const [starts, pending] = await Promise.all([
      this.plants.seasonStartsFor(ids),
      this.taskRows.pendingForPlants(ids, TaskSource.CROP_PLAN),
    ]);
    // Seed and sow reminders whose window closed unsown are no longer suggested.
    const stale = pending.filter((t) => closedUnsown(t, now));
    await this.taskRows.cancelByIds(stale.map((t) => t.id));
    const staleIds = new Set(stale.map((t) => t.id));
    const open = new Set(
      pending.filter((t) => !staleIds.has(t.id)).map((t) => t.source_key),
    );

    let created = 0;
    for (const plant of waiting) {
      const crop = catalogue.crop(plant.crop_id)!;
      const used = (starts.get(plant.id) ?? [])
        .map((start) => windowContaining(crop, group, start)?.start)
        .filter((d): d is Date => Boolean(d));
      const window = nextWindow(crop, group, now, used);
      if (!window) continue;
      const drafts = this.reminders(
        crop,
        catalogue.method(crop.method),
        plant,
        window.start,
        window.end,
        now,
      ).filter((d) => !open.has(d.sourceKey));
      if (drafts.length === 0) continue;
      const results = await this.tasks.createTasks(userId, plant.id, drafts);
      created += results.filter((r) => r.status === 'created').length;
    }
    return { created_count: created };
  }

  private reminders(
    crop: CropInfo,
    method: PlantingMethod,
    plant: Plant,
    windowStart: Date,
    windowEnd: Date,
    now: Date,
  ): TaskDraft[] {
    const key = (step: string) =>
      `crop:${plant.id}:${isoDay(windowStart)}:${step}`;
    const { material, journey } = method;
    const seedsKey: Exclude<CropTitleKey, 'care'> = material
      ? 'seeds.material'
      : 'seeds';
    const sowKey: Exclude<CropTitleKey, 'care'> =
      journey === 'PLANT'
        ? 'sow.plant'
        : journey === 'NURSERY'
          ? 'sow.nursery'
          : 'sow.bed';
    // Titles are saved in English; the key in metadata writes them in other languages.
    const titleOf = (k: Exclude<CropTitleKey, 'care'>) =>
      fillCropTitle(k, titleName(crop), material ?? '');
    return [
      {
        type: TaskType.OBSERVE,
        category: TaskCategory.OBSERVATION,
        priority: TaskPriority.MEDIUM,
        title: titleOf(seedsKey),
        source: TaskSource.CROP_PLAN,
        sourceKey: key('seeds'),
        reason: `Sowing season for ${titleName(crop)} starts soon in your region.`,
        // TODO(seed-order): link this step to ordering seeds in the app (marketplace module).
        metadata: {
          crop_id: crop.id,
          step: 'seeds',
          title: { key: seedsKey, crop: crop.id },
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
        title: titleOf(sowKey),
        source: TaskSource.CROP_PLAN,
        sourceKey: key('sow'),
        reason: `It's the right time to sow ${titleName(crop)} in your region.`,
        metadata: {
          crop_id: crop.id,
          step: 'sow',
          title: { key: sowKey, crop: crop.id },
          window_end: windowEnd.toISOString(),
        },
        dueDate: later(now, windowStart),
      },
    ];
  }
}

/** A seed or sow reminder whose sowing window has already closed. */
function closedUnsown(task: Task, now: Date): boolean {
  const meta = (task.metadata ?? {}) as Record<string, unknown>;
  return (
    (meta.step === 'seeds' || meta.step === 'sow') &&
    typeof meta.window_end === 'string' &&
    new Date(meta.window_end) <= now
  );
}
