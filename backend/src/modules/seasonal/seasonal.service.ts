import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  LifecycleStage,
  PersonalizedOverlay,
  Prisma,
  RegionCluster,
  SeasonalPack,
  SeasonWindow,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  Task,
  TaskType,
  Plant,
  User,
} from '@prisma/client';
import { WeatherService } from './services/weather.service';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SeasonalIntelligenceService } from '../plant-ledger/services/seasonal-intelligence.service';
import { SpeciesNormalizationService } from '../plant-ledger/services/species-normalization.service';

interface TaskTemplateInput {
  key: string;
  title: string;
  category: string;
  priority: string;
  due_in_days: number;
  reason?: string;
}

interface TreeIntelligenceResult {
  seasonal_pack: SeasonalPack;
  personalized_overlay: PersonalizedOverlay | null;
  is_paid_user: boolean;
}

@Injectable()
export class SeasonalService {
  constructor(
    @InjectQueue('weather-checks') private weatherQueue: Queue,
    private weatherService: WeatherService,
    private redisService: RedisService,
    private prisma: PrismaService,
    private seasonalIntelligenceService: SeasonalIntelligenceService,
    private speciesNormalizationService: SpeciesNormalizationService,
  ) {}

  async getLocalizedWeather(pincode: string) {
    const cached = await this.redisService.get(`weather:${pincode}`);
    if (cached) return JSON.parse(cached);

    await this.weatherQueue.add('check', { pincode });
    return this.weatherService.getWeather(pincode);
  }

  async getSeasonalGuide(district: string) {
    return this.weatherService.getSeasonalSuggestions(district);
  }

  async getTreeIntelligence(userId: string, treeId: string) {
    const treeRecord = await this.getTreeRecord(userId, treeId);
    const seasonalPack = await this.getOrCreateSeasonalPack(treeRecord.plant, treeRecord.user);
    const personalizedOverlay = await this.getOrRefreshPersonalizedOverlay(
      treeRecord.plant,
      treeRecord.user,
      treeRecord.journal_entries,
      seasonalPack,
    );

    return {
      seasonal_pack: this.serializeSeasonalPack(seasonalPack),
      personalized_overlay: personalizedOverlay ? this.serializeOverlay(personalizedOverlay) : null,
      is_paid_user: this.isPaidUser(treeRecord.user),
    };
  }

  async materializeTasksForTree(userId: string, treeId: string) {
    const treeIntelligence = (await this.getTreeIntelligence(userId, treeId)) as TreeIntelligenceResult;

    const createdTasks: Task[] = [];
    const baseTemplates = this.asTaskTemplates(treeIntelligence.seasonal_pack.task_templates);
    for (const template of baseTemplates) {
      const task = await this.createTaskIfMissing(treeId, TaskSource.SEASONAL_PACK, template, {
        seasonal_pack_id: treeIntelligence.seasonal_pack.id,
      });
      if (task) createdTasks.push(task);
    }

    const overlayTemplates = treeIntelligence.personalized_overlay
      ? this.asTaskTemplates(treeIntelligence.personalized_overlay.personalized_tasks)
      : [];
    for (const template of overlayTemplates) {
      const task = await this.createTaskIfMissing(treeId, TaskSource.PERSONALIZED_OVERLAY, template, {
        personalized_overlay_id: treeIntelligence.personalized_overlay?.id,
      });
      if (task) createdTasks.push(task);
    }

    return {
      created_count: createdTasks.length,
      created_tasks: createdTasks.map((task) => ({
        id: task.id,
        title: task.title,
        due_date: task.due_date,
        source: task.source,
        reason: task.reason,
      })),
    };
  }

  private async getTreeRecord(userId: string, treeId: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id: treeId, user_id: userId },
      include: {
        user: true,
        journal_entries: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    const { user, journal_entries, ...treeFields } = plant;
    return {
      plant: treeFields as Plant,
      user,
      journal_entries,
    };
  }

  private async getOrCreateSeasonalPack(plant: Plant, user: User) {
    const regionCluster = this.resolveRegionCluster(user);
    const speciesFamily = this.speciesNormalizationService.resolveSpeciesFamily(plant);
    const seasonWindow = this.resolveSeasonWindow(new Date());

    const existing = await this.prisma.seasonalPack.findUnique({
      where: {
        seasonal_pack_cohort_version: {
          region_cluster: regionCluster,
          species_family: speciesFamily,
          lifecycle_stage: plant.lifecycle_stage,
          season_window: seasonWindow,
          pack_version: 1,
        },
      },
    });

    if (existing) return existing;

    const inferred = this.seasonalIntelligenceService.inferTreeSeasonalState(plant, user);

    return this.prisma.seasonalPack.create({
      data: {
        region_cluster: regionCluster,
        species_family: speciesFamily,
        lifecycle_stage: plant.lifecycle_stage,
        season_window: seasonWindow,
        pack_version: 1,
        model_version: 'bootstrap_rules_v1',
        current_phase: inferred.current_phase,
        upcoming_phase: inferred.upcoming_phase,
        confidence: inferred.confidence,
        do_now: inferred.do_now,
        avoid_now: inferred.avoid_now,
        watch_for: inferred.watch_for,
        task_templates: this.buildTaskTemplates(inferred) as unknown as Prisma.InputJsonValue,
        basis: inferred.basis,
      },
    });
  }

  private async getOrRefreshPersonalizedOverlay(
    plant: Plant,
    user: User,
    journal_entries: Array<{ content: string | null; metadata: Prisma.JsonValue | null; timestamp: Date }>,
    seasonalPack: SeasonalPack,
  ) {
    if (!this.isPaidUser(user)) {
      return null;
    }

    const existing = await this.prisma.personalizedOverlay.findFirst({
      where: {
        user_id: user.id,
        plant_id: plant.id,
        seasonal_pack_id: seasonalPack.id,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      orderBy: { updated_at: 'desc' },
    });

    const overlayPayload = this.buildPersonalizedOverlay(plant, journal_entries, seasonalPack);
    if (!overlayPayload) {
      return existing;
    }

    if (existing) {
      return this.prisma.personalizedOverlay.update({
        where: { id: existing.id },
        data: overlayPayload,
      });
    }

    return this.prisma.personalizedOverlay.create({
      data: {
        user_id: user.id,
        plant_id: plant.id,
        seasonal_pack_id: seasonalPack.id,
        ...overlayPayload,
      },
    });
  }

  private buildTaskTemplates(inferred: {
    do_now: string[];
    watch_for: string[];
    next_checkpoint_days: number;
  }): TaskTemplateInput[] {
    const templates: TaskTemplateInput[] = [];

    if (inferred.do_now[0]) {
      templates.push({
        key: 'seasonal_primary_action',
        title: inferred.do_now[0],
        category: 'inspection',
        priority: 'high',
        due_in_days: inferred.next_checkpoint_days,
        reason: 'Primary seasonal action from cohort guidance',
      });
    }

    if (inferred.watch_for[0]) {
      templates.push({
        key: 'seasonal_watch_risk',
        title: `Watch for ${inferred.watch_for[0]}`,
        category: 'observation',
        priority: 'medium',
        due_in_days: inferred.next_checkpoint_days,
        reason: 'Risk monitoring from cohort guidance',
      });
    }

    return templates;
  }

  private buildPersonalizedOverlay(
    plant: Plant,
    journal_entries: Array<{ content: string | null; metadata: Prisma.JsonValue | null; timestamp: Date }>,
    seasonalPack: SeasonalPack,
  ) {
    const drynessDetected = journal_entries.some((log) => this.logSuggestsDryness(log.content, log.metadata));
    if (!drynessDetected) {
      return null;
    }

    return {
      adjusted_phase: `${seasonalPack.current_phase}_with_dryness_attention`,
      priority_actions: ['Water the plant today', 'Recheck leaf stress after watering'],
      suppressed_actions: ['Do not defer irrigation until the next normal checkpoint'],
      personalized_tasks: [
        {
          key: 'water_tree_today',
          title: 'Water the plant today',
          category: 'watering',
          priority: 'high',
          due_in_days: 0,
          reason: `Dryness signal detected for ${plant.name}`,
        },
        {
          key: 'recheck_dryness_response',
          title: 'Recheck the plant after watering',
          category: 'inspection',
          priority: 'medium',
          due_in_days: 2,
          reason: 'Confirm recovery after dryness intervention',
        },
      ],
      reasoning_summary: 'Recent journal_entries indicate dryness or water stress, so irrigation support is needed immediately.',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
      refreshed_at: new Date(),
    };
  }

  private async createTaskIfMissing(
    treeId: string,
    source: TaskSource,
    template: TaskTemplateInput,
    refs: { seasonal_pack_id?: string; personalized_overlay_id?: string },
  ) {
    const existing = await this.prisma.task.findFirst({
      where: {
        plant_id: treeId,
        source,
        source_key: template.key,
        status: TaskStatus.PENDING,
      },
    });

    if (existing) return null;

    return this.prisma.task.create({
      data: {
        plant_id: treeId,
        type: this.mapTaskType(template.category),
        title: template.title,
        category: this.mapTaskCategory(template.category),
        priority: this.mapTaskPriority(template.priority),
        source,
        source_key: template.key,
        reason: template.reason,
        metadata: template as unknown as Prisma.InputJsonValue,
        due_date: new Date(Date.now() + Math.max(template.due_in_days, 0) * 24 * 60 * 60 * 1000),
        seasonal_pack_id: refs.seasonal_pack_id,
        personalized_overlay_id: refs.personalized_overlay_id,
      },
    });
  }

  private resolveRegionCluster(user: User): RegionCluster {
    const district = (user.district || '').toLowerCase();
    if (district.includes('malda') || district.includes('kolkata') || district.includes('patna')) {
      return RegionCluster.EAST_INDIA;
    }
    if (district.includes('delhi') || district.includes('lucknow') || district.includes('chandigarh')) {
      return RegionCluster.NORTH_INDIA;
    }
    if (district.includes('mumbai') || district.includes('pune') || district.includes('surat')) {
      return RegionCluster.WEST_INDIA;
    }
    if (district.includes('bhopal') || district.includes('indore') || district.includes('raipur')) {
      return RegionCluster.CENTRAL_INDIA;
    }
    if (district.includes('chennai') || district.includes('hyderabad') || district.includes('bengaluru')) {
      return RegionCluster.SOUTH_DECCAN;
    }
    if (district.includes('coast') || district.includes('goa') || district.includes('kochi')) {
      return RegionCluster.COASTAL_HUMID;
    }
    if (district.includes('shimla') || district.includes('dehradun') || district.includes('gangtok')) {
      return RegionCluster.HILLS_COOL;
    }
    return RegionCluster.NORTH_INDIA;
  }

  private resolveSeasonWindow(now: Date): SeasonWindow {
    const month = now.getMonth() + 1;
    if (month === 1 || month === 2) return SeasonWindow.LATE_WINTER;
    if (month === 3 || month === 4) return SeasonWindow.SPRING;
    if (month === 5 || month === 6) return SeasonWindow.SUMMER;
    if (month >= 7 && month <= 9) return SeasonWindow.MONSOON;
    return SeasonWindow.POST_MONSOON;
  }

  private isPaidUser(user: User): boolean {
    return user.badge_level === 'Rooted';
  }

  private logSuggestsDryness(content: string | null, metadata: Prisma.JsonValue | null): boolean {
    const haystack = `${content || ''} ${metadata ? JSON.stringify(metadata) : ''}`.toLowerCase();
    return ['dry', 'dryness', 'water stress', 'wilting', 'thirsty', 'soil dry'].some((term) => haystack.includes(term));
  }

  private asTaskTemplates(value: Prisma.JsonValue | null): TaskTemplateInput[] {
    if (!Array.isArray(value)) return [];
    return value.reduce<TaskTemplateInput[]>((acc, item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return acc;
      }

      const record = item as Record<string, unknown>;
      if (typeof record.key !== 'string' || typeof record.title !== 'string') {
        return acc;
      }

      acc.push({
        key: record.key,
        title: record.title,
        category: typeof record.category === 'string' ? record.category : 'inspection',
        priority: typeof record.priority === 'string' ? record.priority : 'medium',
        due_in_days: typeof record.due_in_days === 'number' ? record.due_in_days : 0,
        reason: typeof record.reason === 'string' ? record.reason : undefined,
      });
      return acc;
    }, []);
  }

  private mapTaskType(category: string): TaskType {
    switch (category.toLowerCase()) {
      case 'watering':
        return TaskType.WATER;
      case 'pruning':
        return TaskType.PRUNE;
      case 'feeding':
        return TaskType.FEED;
      case 'harvest':
        return TaskType.HARVEST;
      case 'treatment':
        return TaskType.TREAT;
      case 'observation':
        return TaskType.OBSERVE;
      default:
        return TaskType.INSPECT;
    }
  }

  private mapTaskCategory(category: string): TaskCategory {
    switch (category.toLowerCase()) {
      case 'watering':
        return TaskCategory.WATERING;
      case 'pruning':
        return TaskCategory.PRUNING;
      case 'feeding':
        return TaskCategory.FEEDING;
      case 'harvest':
        return TaskCategory.HARVEST;
      case 'treatment':
        return TaskCategory.TREATMENT;
      case 'observation':
        return TaskCategory.OBSERVATION;
      default:
        return TaskCategory.INSPECTION;
    }
  }

  private mapTaskPriority(priority: string): TaskPriority {
    switch (priority.toLowerCase()) {
      case 'low':
        return TaskPriority.LOW;
      case 'high':
        return TaskPriority.HIGH;
      default:
        return TaskPriority.MEDIUM;
    }
  }

  private serializeSeasonalPack(pack: SeasonalPack) {
    return {
      ...pack,
      do_now: pack.do_now,
      avoid_now: pack.avoid_now,
      watch_for: pack.watch_for,
      task_templates: pack.task_templates,
    };
  }

  private serializeOverlay(overlay: PersonalizedOverlay) {
    return {
      ...overlay,
      priority_actions: overlay.priority_actions,
      suppressed_actions: overlay.suppressed_actions,
      personalized_tasks: overlay.personalized_tasks,
    };
  }
}
