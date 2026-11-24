import { Injectable } from '@nestjs/common';
import {
  Plant,
  Prisma,
  RecordKind,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskType,
} from '@prisma/client';
import { NotFoundError } from '../../../common/errors';
import { addDays, Clock } from '../../../common/time';
import {
  PlantRecordService,
  SpeciesNormalizationService,
  TaskCreationResult,
  TaskDraft,
  TaskService,
  climateGroupFor,
  flowerCareDue,
  taskCategoryFromCategory,
  taskPriorityFrom,
  taskTypeFromCategory,
  treeCareDue,
} from '../../plant-ledger';
import type { CareReminder } from '../../plant-ledger';
import { UserRepository } from '../../user';
import { asTaskTemplates, TaskTemplateInput } from '../domain/overlay-rules';
import { regionFor } from '../../regions';
import { TreeIntelligenceService } from './tree-intelligence.service';

/** Turns a tree's reviewed care (or a flower's care calendar) and its personal adjustment into tasks. */
@Injectable()
export class TreeTaskMaterializer {
  constructor(
    private readonly intelligence: TreeIntelligenceService,
    private readonly plants: PlantRecordService,
    private readonly tasks: TaskService,
    private readonly users: UserRepository,
    private readonly species: SpeciesNormalizationService,
    private readonly clock: Clock,
  ) {}

  /** Turns current guidance into tasks; already-pending tasks are reported as skipped. */
  async materializeTasksForTree(
    userId: string,
    plantId: string,
  ): Promise<{ results: TaskCreationResult[]; created_count: number }> {
    const growing = await this.plants.assertGrowing(userId, plantId);
    // Journey crops follow the crop calendar, never the tree season pack.
    if (growing.crop_id) return { results: [], created_count: 0 };
    // Perennial flowers follow their own care calendar, never the fruit pack.
    if (growing.record_kind === RecordKind.FLOWER)
      return this.materializeFlowerCare(userId, growing);
    const { overlay, care, user } = await this.intelligence.load(
      userId,
      plantId,
    );
    const now = this.clock.now();
    const toDraft = (
      template: TaskTemplateInput,
      source: TaskSource,
      refs: Pick<TaskDraft, 'personalizedOverlayId'>,
      // A template key repeats; the overlay id makes it one occurrence.
      owner: string,
    ): TaskDraft => ({
      type: taskTypeFromCategory(template.category),
      category: taskCategoryFromCategory(template.category),
      priority: taskPriorityFrom(template.priority),
      title: template.title,
      source,
      sourceKey: `${owner}:${template.key}`,
      reason: template.reason,
      metadata: template as unknown as Prisma.InputJsonValue,
      dueDate: addDays(now, Math.max(template.due_in_days, 0)),
      ...refs,
    });

    // Reviewed care gives dated reminders; a tree without it gets none (no
    // season-pack filler) and the retire step cancels pack tasks left from before.
    const careDue = care
      ? treeCareDue(care, {
          region: regionFor(user),
          stage: growing.lifecycle_stage,
          plantedAt: growing.planting_date,
          plantingPrecision: growing.planting_date_precision,
          now,
          openKeys: await this.tasks.pendingCareKeys(userId, plantId),
        })
      : null;
    const drafts = [
      ...(careDue?.reminders.map(careDraft) ?? []),
      ...(overlay
        ? asTaskTemplates(overlay.personalized_tasks).map((t) =>
            toDraft(
              t,
              TaskSource.PERSONALIZED_OVERLAY,
              {
                personalizedOverlayId: overlay.id,
              },
              overlay.id,
            ),
          )
        : []),
    ];
    const results = await this.tasks.createTasks(userId, plantId, drafts);
    // With no care now (variety changed, care retired, region pending), every
    // care reminder left on the tree is stale.
    await this.tasks.retireCareTasksExcept(
      userId,
      plantId,
      careDue?.current ?? [],
    );
    await this.tasks.retireSeasonTasksExcept(
      userId,
      plantId,
      drafts.map((d) => d.sourceKey),
    );
    return {
      results,
      created_count: results.filter((r) => r.status === 'created').length,
    };
  }

  private async materializeFlowerCare(userId: string, plant: Plant) {
    const species = await this.species.resolver();
    const flower = species.catalogue.perennialFlower(species.family(plant));
    if (!flower) return { results: [], created_count: 0 };
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    const group = climateGroupFor(regionFor(user));
    const kinds = {
      PRUNING: [TaskType.PRUNE, TaskCategory.PRUNING],
      FEEDING: [TaskType.FEED, TaskCategory.FEEDING],
      GENERAL: [TaskType.OBSERVE, TaskCategory.OBSERVATION],
    } as const;
    const drafts: TaskDraft[] = flowerCareDue(
      flower,
      group,
      this.clock.now(),
    ).map((c) => ({
      type: kinds[c.category][0],
      category: kinds[c.category][1],
      priority: TaskPriority.MEDIUM,
      title: c.title,
      source: TaskSource.FLOWER_CARE,
      sourceKey: c.sourceKey,
      reason: `Usual ${c.key === 'prune' ? 'pruning' : c.key === 'feed' ? 'feeding' : 'care'} time for ${flower.name}.`,
      dueDate: c.due,
    }));
    const results = await this.tasks.createTasks(userId, plant.id, drafts);
    return {
      results,
      created_count: results.filter((r) => r.status === 'created').length,
    };
  }
}

const CARE_TASK = {
  FEEDING: [TaskType.FEED, TaskCategory.FEEDING],
  PRUNING: [TaskType.PRUNE, TaskCategory.PRUNING],
  PROTECTION: [TaskType.TREAT, TaskCategory.TREATMENT],
  WATERING: [TaskType.WATER, TaskCategory.WATERING],
  GENERAL: [TaskType.OBSERVE, TaskCategory.OBSERVATION],
} as const;

/** A care reminder as a task: how-to in metadata for the task card (and later notifications). */
function careDraft(r: CareReminder): TaskDraft {
  return {
    type: CARE_TASK[r.category][0],
    category: CARE_TASK[r.category][1],
    priority:
      r.category === 'PROTECTION' ? TaskPriority.HIGH : TaskPriority.MEDIUM,
    title: r.title,
    source: TaskSource.TREE_CARE,
    sourceKey: r.sourceKey,
    reason: r.why,
    metadata: {
      organic: r.organic,
      chemical: r.chemical,
      why: r.why,
      amount: r.amount,
      window_end: r.windowEnd.toISOString(),
    },
    dueDate: r.due,
  };
}
