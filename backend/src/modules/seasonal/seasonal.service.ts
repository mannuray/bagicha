import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  PersonalizedOverlay,
  Plant,
  Prisma,
  SeasonalPack,
  TaskSource,
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
  taskCategoryFromCategory,
  taskPriorityFrom,
  taskTypeFromCategory,
} from '../plant-ledger';
import { isPremium, UserRepository } from '../user';
import {
  asTaskTemplates,
  buildPersonalizedOverlay,
  buildTaskTemplates,
  TaskTemplateInput,
} from './domain/overlay-rules';
import { regionFor } from './domain/region-cluster';
import { resolveSeasonWindow } from './domain/season-window';
import { OverlayRepository } from './repositories/overlay.repository';
import { SeasonalPackRepository } from './repositories/seasonal-pack.repository';
import { WeatherService } from './services/weather.service';

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
    await this.weatherQueue.add('check', { pincode });
    return this.weatherService.getWeather(pincode);
  }

  getSeasonalGuide(district: string) {
    return this.weatherService.getSeasonalSuggestions(district);
  }

  async getTreeIntelligence(userId: string, plantId: string) {
    const { pack, overlay, premium } = await this.loadIntelligence(
      userId,
      plantId,
    );
    return {
      seasonal_pack: pack,
      personalized_overlay: overlay,
      is_paid_user: premium,
    };
  }

  /** Turns current guidance into tasks; already-pending tasks are reported as skipped. */
  async materializeTasksForTree(
    userId: string,
    plantId: string,
  ): Promise<{ results: TaskCreationResult[]; created_count: number }> {
    const { pack, overlay } = await this.loadIntelligence(userId, plantId);
    const now = this.clock.now();
    const toDraft = (
      template: TaskTemplateInput,
      source: TaskSource,
      refs: Pick<TaskDraft, 'seasonalPackId' | 'personalizedOverlayId'>,
    ): TaskDraft => ({
      type: taskTypeFromCategory(template.category),
      category: taskCategoryFromCategory(template.category),
      priority: taskPriorityFrom(template.priority),
      title: template.title,
      source,
      sourceKey: template.key,
      reason: template.reason,
      metadata: template as unknown as Prisma.InputJsonValue,
      dueDate: addDays(now, Math.max(template.due_in_days, 0)),
      ...refs,
    });

    const drafts = [
      ...asTaskTemplates(pack.task_templates).map((t) =>
        toDraft(t, TaskSource.SEASONAL_PACK, { seasonalPackId: pack.id }),
      ),
      ...(overlay
        ? asTaskTemplates(overlay.personalized_tasks).map((t) =>
            toDraft(t, TaskSource.PERSONALIZED_OVERLAY, {
              personalizedOverlayId: overlay.id,
            }),
          )
        : []),
    ];
    const results = await this.tasks.createTasks(userId, plantId, drafts);
    return {
      results,
      created_count: results.filter((r) => r.status === 'created').length,
    };
  }

  private async loadIntelligence(userId: string, plantId: string) {
    const plant = await this.plants.getOwnedOrThrow(userId, plantId);
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    const premium = isPremium(user, this.clock.now());
    const pack = await this.getOrCreatePack(plant, user);
    const overlay = premium
      ? await this.getOrRefreshOverlay(userId, plant, pack)
      : null;
    return { pack, overlay, premium };
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
    return this.packs.create({
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
    });
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
