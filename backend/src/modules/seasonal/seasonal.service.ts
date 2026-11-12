import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  PersonalizedOverlay,
  Plant,
  Prisma,
  SeasonalPack,
  RecordKind,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskType,
  User,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { NotFoundError } from '../../common/errors';
import { Metrics } from '../../common/observability';
import { RedisService } from '../../common/redis/redis.service';
import { addDays, Clock } from '../../common/time';
import {
  JournalService,
  PlantRecordService,
  SeasonalIntelligenceService,
  SpeciesNormalizationService,
  TaskCreationResult,
  TaskDraft,
  TaskService,
  CROPS,
  climateGroupFor,
  windowStatus,
  flowerCareDue,
  perennialFlower,
  taskCategoryFromCategory,
  taskPriorityFrom,
  taskTypeFromCategory,
  carePhaseView,
  treeCareDue,
  TREE_CARE_REGISTRY,
} from '../plant-ledger';
import type { CareReminder, FamilyCare } from '../plant-ledger';
import { isPremium, UserRepository } from '../user';
import {
  asTaskTemplates,
  buildPersonalizedOverlay,
  buildTaskTemplates,
  TaskTemplateInput,
} from './domain/overlay-rules';
import { regionFor } from './domain/region-cluster';
import { seasonGuide } from './domain/season-guide';
import { resolveSeasonWindow } from './domain/season-window';
import { OverlayRepository } from './repositories/overlay.repository';
import { SeasonalPackRepository } from './repositories/seasonal-pack.repository';
import { WeatherService } from './services/weather.service';
import { isUniqueViolation } from '../../common/prisma/unique-violation';
import { toOverlayView, toPackView } from './intelligence-view';

export const WEATHER_QUEUE = 'weather-checks';
const PACK_VERSION = 1;
const RECENT_ENTRIES_FOR_OVERLAY = 10;

@Injectable()
export class SeasonalService implements OnModuleInit {
  constructor(
    @InjectQueue(WEATHER_QUEUE) private readonly weatherQueue: Queue,
    private readonly weatherService: WeatherService,
    private readonly redis: RedisService,
    private readonly plants: PlantRecordService,
    private readonly journal: JournalService,
    private readonly tasks: TaskService,
    private readonly users: UserRepository,
    private readonly packs: SeasonalPackRepository,
    private readonly overlays: OverlayRepository,
    private readonly seasonalIntelligence: SeasonalIntelligenceService,
    private readonly species: SpeciesNormalizationService,
    private readonly clock: Clock,
    private readonly metrics: Metrics,
    @InjectPinoLogger(SeasonalService.name)
    private readonly logger: PinoLogger,
    @Inject(TREE_CARE_REGISTRY)
    private readonly careRegistry: Readonly<Record<string, FamilyCare>>,
  ) {}

  onModuleInit(): void {
    this.metrics.registerQueueDepth(WEATHER_QUEUE, async () => {
      const counts = await this.weatherQueue.getJobCounts(
        'waiting',
        'active',
        'delayed',
      );
      return (
        (counts.waiting ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0)
      );
    });
  }

  async getLocalizedWeather(pincode: string) {
    const cached = await this.redis.get(`weather:${pincode}`);
    if (cached) return JSON.parse(cached) as unknown;
    // One pending check per pincode; a queue hiccup still shows the weather.
    void this.weatherQueue
      .add('check', { pincode }, { jobId: `weather-${pincode}` })
      .catch((err: unknown) =>
        this.logger.warn({ err }, 'Weather check not queued'),
      );
    return this.weatherService.getWeather(pincode);
  }

  /** Season advice, with "good to sow now" from the crop calendar for the user's region. */
  getSeasonalGuide(user: Pick<User, 'district' | 'region_cluster'>) {
    const region = regionFor(user);
    const group = climateGroupFor(region);
    const now = this.clock.now();
    const { season, headline, points } = seasonGuide(region, now);
    const crops = CROPS.filter(
      (c) => c.kind === 'CROP' && windowStatus(c, group, now).status === 'open',
    ).map((c) => c.name);
    return { season, advice: headline, points, crops };
  }

  async getTreeIntelligence(userId: string, plantId: string) {
    const { pack, overlay, premium, careNote } = await this.loadIntelligence(
      userId,
      plantId,
    );
    return {
      seasonal_pack: toPackView(pack),
      personalized_overlay: overlay ? toOverlayView(overlay) : null,
      is_paid_user: premium,
      care_note: careNote,
    };
  }

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
    const { pack, overlay, care, user } = await this.loadIntelligence(
      userId,
      plantId,
    );
    const now = this.clock.now();
    const toDraft = (
      template: TaskTemplateInput,
      source: TaskSource,
      refs: Pick<TaskDraft, 'seasonalPackId' | 'personalizedOverlayId'>,
      // A template key repeats every season; the pack (or overlay) id makes it one occurrence.
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

    // A family with reviewed care gets dated care reminders instead of pack tasks;
    // the retire step below then cancels any pack tasks it still has.
    const careDue = care
      ? treeCareDue(care, {
          region: regionFor(user),
          stage: growing.lifecycle_stage,
          plantedAt: growing.planting_date,
          now,
          openKeys: await this.tasks.pendingCareKeys(userId, plantId),
        })
      : null;
    const careDrafts = careDue ? careDue.reminders.map(careDraft) : null;
    const drafts = [
      ...(careDrafts ?? []),
      ...(careDrafts ? [] : asTaskTemplates(pack.task_templates)).map((t) =>
        toDraft(
          t,
          TaskSource.SEASONAL_PACK,
          { seasonalPackId: pack.id },
          pack.id,
        ),
      ),
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
    if (careDue)
      await this.tasks.retireCareTasksExcept(userId, plantId, careDue.current);
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
    const flower = perennialFlower(this.species.resolveSpeciesFamily(plant));
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

  private async loadIntelligence(userId: string, plantId: string) {
    const plant = await this.plants.getOwnedOrThrow(userId, plantId);
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    const now = this.clock.now();
    const premium = isPremium(user, now);
    const care = this.careOf(plant);
    // The pack row stays the overlay's anchor; for a care family its guidance comes from care data.
    const anchor = await this.getOrCreatePack(plant, user);
    const phase = care
      ? carePhaseView(care, {
          region: regionFor(user),
          stage: plant.lifecycle_stage,
          now,
        })
      : null;
    const pack: SeasonalPack = phase
      ? {
          ...anchor,
          current_phase: phase.current_phase,
          upcoming_phase: phase.upcoming_phase,
          do_now: phase.do_now,
          avoid_now: phase.avoid_now,
          watch_for: phase.watch_for,
          confidence: 'high',
          task_templates: [],
        }
      : anchor;
    const overlay = premium
      ? await this.getOrRefreshOverlay(userId, plant, pack)
      : null;
    return {
      pack,
      overlay,
      premium,
      care,
      user,
      careNote: phase?.note ?? null,
    };
  }

  /** Reviewed care for this tree's family, if its batch has shipped (flowers have their own care). */
  private careOf(plant: Plant): FamilyCare | null {
    if (plant.record_kind === RecordKind.FLOWER) return null;
    return this.careRegistry[this.species.resolveSpeciesFamily(plant)] ?? null;
  }

  private async getOrCreatePack(
    plant: Plant,
    user: User,
  ): Promise<SeasonalPack> {
    const cohort = {
      region_cluster: regionFor(user),
      species_family: this.species.resolveSpeciesFamily(plant),
      lifecycle_stage: plant.lifecycle_stage,
      season_window: resolveSeasonWindow(this.clock.now()),
      pack_version: PACK_VERSION,
    };
    const existing = await this.packs.findCohort(cohort);
    if (existing) return existing;

    const inferred = this.seasonalIntelligence.inferTreeSeasonalState(
      plant,
      user,
    );
    const data = {
      ...cohort,
      model_version: 'bootstrap_rules_v1',
      current_phase: inferred.current_phase,
      upcoming_phase: inferred.upcoming_phase,
      confidence: inferred.confidence,
      do_now: inferred.do_now,
      avoid_now: inferred.avoid_now,
      watch_for: inferred.watch_for,
      task_templates: buildTaskTemplates(
        inferred,
      ) as unknown as Prisma.InputJsonValue,
      basis: inferred.basis,
    };
    try {
      return await this.packs.create(data);
    } catch (err) {
      // Two first visits for a new cohort raced; the other one created it.
      if (!isUniqueViolation(err)) throw err;
      const winner = await this.packs.findCohort(cohort);
      if (!winner) throw err;
      return winner;
    }
  }

  private async getOrRefreshOverlay(
    userId: string,
    plant: Plant,
    pack: SeasonalPack,
  ): Promise<PersonalizedOverlay | null> {
    const now = this.clock.now();
    const existing = await this.overlays.findActive(
      userId,
      plant.id,
      pack.id,
      now,
    );
    const entries = await this.journal.recent(
      userId,
      plant.id,
      RECENT_ENTRIES_FOR_OVERLAY,
    );
    const payload = buildPersonalizedOverlay(plant, entries, pack, now);
    if (!payload) return existing;
    return existing
      ? this.overlays.update(userId, existing.id, payload)
      : this.overlays.create(userId, plant.id, pack.id, payload);
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
