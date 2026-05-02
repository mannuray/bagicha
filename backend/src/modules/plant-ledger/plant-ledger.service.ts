import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { AddLogDto } from './dto/add-log.dto';
import { LifecycleService } from './services/lifecycle.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { SeasonalIntelligenceService } from './services/seasonal-intelligence.service';
import { SpeciesNormalizationService } from './services/species-normalization.service';
import {
  DropLevel,
  LogType,
  PlantingDatePrecision,
  Prisma,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskType,
  Plant,
  YieldQuality,
} from '@prisma/client';

interface ParsedPlantingDate {
  date: Date | null;
  precision: PlantingDatePrecision;
  input: string | null;
}

@Injectable()
export class PlantLedgerService {
  constructor(
    private prisma: PrismaService,
    private lifecycleService: LifecycleService,
    private seasonalIntelligenceService: SeasonalIntelligenceService,
    private speciesNormalizationService: SpeciesNormalizationService,
    @InjectQueue('task-generation') private taskQueue: Queue,
  ) {}

  async createPlant(userId: string, createPlantDto: CreatePlantDto) {
    const parsedPlantingDate = this.parsePlantingDate(
      createPlantDto.planting_date,
      createPlantDto.planting_date_precision,
    );
    const initialStage =
      createPlantDto.lifecycle_stage ??
      this.lifecycleService.calculateStage(parsedPlantingDate.date, createPlantDto.species);
    const manualStage = !!createPlantDto.lifecycle_stage;

    const plant = await this.prisma.plant.create({
      data: {
        user_id: userId,
        name: createPlantDto.name,
        species: createPlantDto.species,
        variety: createPlantDto.variety,
        record_kind: createPlantDto.record_kind,
        type: createPlantDto.type,
        growth_habit: createPlantDto.growth_habit,
        record_pattern: createPlantDto.record_pattern,
        planting_date: parsedPlantingDate.date,
        planting_date_precision: parsedPlantingDate.precision,
        planting_date_input: parsedPlantingDate.input,
        lifecycle_stage: initialStage,
        lifecycle_stage_manual: manualStage,
      },
    });

    // Trigger task generation background job
    await this.taskQueue.add('generate', {
      plant_id: plant.id,
      lifecycle_stage: plant.lifecycle_stage,
      species: plant.species,
    });

    return plant;
  }

  async getPlants(userId: string) {
    return this.prisma.plant.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPlantDetail(userId: string, treeId: string) {
    const plant = await this.prisma.plant.findUnique({
      where: { id: treeId },
      include: {
        _count: {
          select: { journal_entries: true },
        },
      },
    });

    if (!plant) throw new NotFoundException('Plant not found');
    if (plant.user_id !== userId) throw new ForbiddenException('Access denied');

    if (!plant.lifecycle_stage_manual) {
      const currentStage = this.lifecycleService.calculateStage(plant.planting_date, plant.species);

      if (currentStage !== plant.lifecycle_stage) {
        await this.prisma.plant.update({
          where: { id: treeId },
          data: { lifecycle_stage: currentStage },
        });

        await this.taskQueue.add('generate', {
          plant_id: plant.id,
          lifecycle_stage: currentStage,
          species: plant.species,
        });

        plant.lifecycle_stage = currentStage;
      }
    }

    return plant;
  }

  async updatePlant(userId: string, treeId: string, updatePlantDto: UpdatePlantDto) {
    const plant = await this.getPlantDetail(userId, treeId);

    const parsedPlantingDate =
      updatePlantDto.planting_date === undefined && updatePlantDto.planting_date_precision === undefined
        ? {
            date: plant.planting_date,
            precision: plant.planting_date_precision,
            input: plant.planting_date_input,
          }
        : this.parsePlantingDate(
            updatePlantDto.planting_date,
            updatePlantDto.planting_date_precision ?? undefined,
          );

    const species = updatePlantDto.species ?? plant.species;
    const lifecycleStage =
      updatePlantDto.lifecycle_stage ??
      this.lifecycleService.calculateStage(parsedPlantingDate.date, species);
    const manualStage = !!updatePlantDto.lifecycle_stage;

    const updatedTree = await this.prisma.plant.update({
      where: { id: treeId },
      data: {
        name: updatePlantDto.name ?? undefined,
        species: updatePlantDto.species ?? undefined,
        variety: updatePlantDto.variety ?? undefined,
        record_kind: updatePlantDto.record_kind ?? undefined,
        type: updatePlantDto.type ?? undefined,
        growth_habit: updatePlantDto.growth_habit ?? undefined,
        record_pattern: updatePlantDto.record_pattern ?? undefined,
        planting_date: parsedPlantingDate.date,
        planting_date_precision: parsedPlantingDate.precision,
        planting_date_input: parsedPlantingDate.input,
        lifecycle_stage: lifecycleStage,
        lifecycle_stage_manual: manualStage,
      },
    });

    await this.taskQueue.add('generate', {
      plant_id: updatedTree.id,
      lifecycle_stage: updatedTree.lifecycle_stage,
      species: updatedTree.species,
    });

    return updatedTree;
  }

  async addLog(userId: string, treeId: string, addLogDto: AddLogDto) {
    const plant = await this.getPlantDetail(userId, treeId);

    return this.prisma.$transaction(async (tx) => {
      const eventAt = addLogDto.event_at ? new Date(addLogDto.event_at) : new Date();
      const cycleYear = this.resolveCycleYear(plant, eventAt);
      const cycle = await tx.plantCycle.upsert({
        where: {
          plant_cycle_year: {
            plant_id: plant.id,
            cycle_year: cycleYear,
          },
        },
        create: {
          plant_id: plant.id,
          cycle_year: cycleYear,
        },
        update: {},
      });

      const { event_at, ...logData } = addLogDto;

      const log = await tx.journalEntry.create({
        data: {
          ...logData,
          plant_id: plant.id,
          plant_cycle_id: cycle.id,
          timestamp: eventAt,
        },
      });

      await this.syncTreeMilestonesFromLog(tx, plant, log.type, log.timestamp);
      await this.refreshCycleSummary(tx, plant.id, cycle.id);
      await this.createFollowUpTaskForLog(tx, plant.id, cycle.id, plant.name, log);

      return log;
    });
  }

  async getTimeline(userId: string, treeId: string, page = 1, pageSize = 20) {
    const plant = await this.getPlantDetail(userId, treeId);

    const journal_entries = await this.prisma.journalEntry.findMany({
      where: { plant_id: plant.id },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalItems = await this.prisma.journalEntry.count({
      where: { plant_id: plant.id },
    });

    return {
      items: journal_entries,
      pagination: {
        page,
        page_size: pageSize,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / pageSize),
        has_next: page * pageSize < totalItems,
        has_previous: page > 1,
      },
    };
  }

  async getSeasonalState(userId: string, treeId: string) {
    const plant = await this.getPlantDetail(userId, treeId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        district: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.seasonalIntelligenceService.inferTreeSeasonalState(plant, user);
  }

  async getCycles(userId: string, treeId: string) {
    await this.getPlantDetail(userId, treeId);

    const cycles = await this.prisma.plantCycle.findMany({
      where: { plant_id: treeId },
      include: {
        journal_entries: {
          orderBy: { timestamp: 'desc' },
          take: 3,
        },
      },
      orderBy: { cycle_year: 'desc' },
    });

    return cycles.map((cycle) => ({
      id: cycle.id,
      cycle_year: cycle.cycle_year,
      observed_flowering_at: cycle.observed_flowering_at,
      observed_fruit_set_at: cycle.observed_fruit_set_at,
      harvest_started_at: cycle.harvest_started_at,
      harvest_completed_at: cycle.harvest_completed_at,
      yield_quantity: cycle.yield_quantity,
      yield_unit: cycle.yield_unit,
      yield_quality: cycle.yield_quality,
      flower_drop_level: cycle.flower_drop_level,
      fruit_drop_level: cycle.fruit_drop_level,
      stress_score: cycle.stress_score,
      pest_pressure_score: cycle.pest_pressure_score,
      treatment_count: cycle.treatment_count,
      cycle_summary: cycle.cycle_summary,
      recommended_next_cycle_actions: cycle.recommended_next_cycle_actions,
      recent_events: cycle.journal_entries.map((log) => ({
        id: log.id,
        type: log.type,
        content: log.content,
        timestamp: log.timestamp,
      })),
    }));
  }

  async getTasks(userId: string, treeId: string) {
    await this.getPlantDetail(userId, treeId);

    const tasks = await this.prisma.task.findMany({
      where: { plant_id: treeId },
      include: {
        plant_cycle: {
          select: { cycle_year: true },
        },
        seasonal_pack: {
          select: {
            current_phase: true,
            upcoming_phase: true,
          },
        },
        personalized_overlay: {
          select: {
            reasoning_summary: true,
            adjusted_phase: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { due_date: 'asc' },
        { created_at: 'desc' },
      ],
      take: 20,
    });

    return tasks.map((task) => this.mapTask(task));
  }

  async getUserTasks(userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        plant: {
          user_id: userId,
        },
      },
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            record_kind: true,
          },
        },
        plant_cycle: {
          select: { cycle_year: true },
        },
        seasonal_pack: {
          select: {
            current_phase: true,
            upcoming_phase: true,
          },
        },
        personalized_overlay: {
          select: {
            reasoning_summary: true,
            adjusted_phase: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { due_date: 'asc' },
        { created_at: 'desc' },
      ],
      take: 30,
    });

    return tasks.map((task) => this.mapTask(task));
  }

  async getMitigationPlan(userId: string, treeId: string) {
    await this.getPlantDetail(userId, treeId);

    const cycles = await this.prisma.plantCycle.findMany({
      where: { plant_id: treeId },
      orderBy: { cycle_year: 'desc' },
      take: 2,
    });

    const recentHealthLogs = await this.prisma.journalEntry.findMany({
      where: {
        plant_id: treeId,
        type: {
          in: [LogType.DIAGNOSIS, LogType.PEST_DIAGNOSIS, LogType.TREATMENT, LogType.WATERING_STRESS],
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 6,
    });
    const latestCycleLogs = cycles[0]
      ? await this.prisma.journalEntry.findMany({
          where: { plant_id: treeId, plant_cycle_id: cycles[0].id },
          orderBy: { timestamp: 'desc' },
          take: 12,
        })
      : [];

    const latestCycleTasks = cycles[0]
      ? await this.prisma.task.findMany({
          where: { plant_id: treeId, plant_cycle_id: cycles[0].id },
          select: { status: true, title: true },
        })
      : [];

    const latest = cycles[0] ?? null;
    const previous = cycles[1] ?? null;

    const likelyIssues = this.rankLikelyIssues(latest, previous, recentHealthLogs, latestCycleTasks, latestCycleLogs);
    const whatToChange = this.buildWhatToChange(latest, previous, recentHealthLogs, latestCycleTasks, latestCycleLogs);
    const watchEarly = this.buildWatchEarly(latest, recentHealthLogs, latestCycleLogs);
    const priorityActions = this.buildPriorityActions(latest, previous, recentHealthLogs, latestCycleTasks, latestCycleLogs);
    const completedTasks = latestCycleTasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
    const skippedTasks = latestCycleTasks.filter((task) => task.status === TaskStatus.SKIPPED).length;
    const pendingTasks = latestCycleTasks.filter((task) => task.status === TaskStatus.PENDING).length;

    return {
      cycle_year: latest?.cycle_year ?? null,
      summary: this.buildMitigationSummary(latest, previous, likelyIssues),
      likely_issues: likelyIssues,
      what_to_change: whatToChange,
      watch_early: watchEarly,
      priority_actions: priorityActions,
      completed_tasks: completedTasks,
      skipped_tasks: skippedTasks,
      pending_tasks: pendingTasks,
    };
  }

  async updateTaskStatus(userId: string, treeId: string, taskId: string, status: TaskStatus) {
    await this.getPlantDetail(userId, treeId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.plant_id !== treeId) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completed_at: status === TaskStatus.COMPLETED ? new Date() : null,
      },
      include: {
        plant_cycle: {
          select: { cycle_year: true },
        },
        seasonal_pack: {
          select: {
            current_phase: true,
            upcoming_phase: true,
          },
        },
        personalized_overlay: {
          select: {
            reasoning_summary: true,
            adjusted_phase: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      type: updated.type,
      title: updated.title ?? this.defaultTaskTitle(updated.type),
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      source: updated.source,
      reason: updated.reason,
      due_date: updated.due_date,
      completed_at: updated.completed_at,
      plant_cycle_id: updated.plant_cycle_id,
      cycle_year: updated.plant_cycle?.cycle_year ?? null,
      source_summary: this.buildTaskSourceSummary(updated),
    };
  }

  private parsePlantingDate(
    input?: string | null,
    requestedPrecision?: PlantingDatePrecision | null,
  ): ParsedPlantingDate {
    if (input === null || input === undefined || input.trim() === '') {
      return {
        date: null,
        precision: PlantingDatePrecision.UNKNOWN,
        input: input === undefined ? null : input,
      };
    }

    const normalized = input.trim();
    const precision = requestedPrecision ?? this.inferPlantingDatePrecision(normalized);

    if (precision === PlantingDatePrecision.YEAR) {
      const year = Number(normalized);
      if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        return { date: null, precision: PlantingDatePrecision.UNKNOWN, input: normalized };
      }
      return {
        date: new Date(Date.UTC(year, 0, 1)),
        precision,
        input: normalized,
      };
    }

    if (precision === PlantingDatePrecision.MONTH_YEAR) {
      const match = normalized.match(/^(\d{4})-(\d{1,2})$/);
      if (!match) {
        return { date: null, precision: PlantingDatePrecision.UNKNOWN, input: normalized };
      }

      const year = Number(match[1]);
      const month = Number(match[2]);
      if (month < 1 || month > 12) {
        return { date: null, precision: PlantingDatePrecision.UNKNOWN, input: normalized };
      }

      return {
        date: new Date(Date.UTC(year, month - 1, 1)),
        precision,
        input: normalized,
      };
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return { date: null, precision: PlantingDatePrecision.UNKNOWN, input: normalized };
    }

    return {
      date: parsed,
      precision: PlantingDatePrecision.EXACT_DATE,
      input: normalized,
    };
  }

  private inferPlantingDatePrecision(input: string): PlantingDatePrecision {
    if (/^\d{4}$/.test(input)) {
      return PlantingDatePrecision.YEAR;
    }

    if (/^\d{4}-\d{1,2}$/.test(input)) {
      return PlantingDatePrecision.MONTH_YEAR;
    }

    return PlantingDatePrecision.EXACT_DATE;
  }

  private resolveCycleYear(plant: Pick<Plant, 'name' | 'species' | 'variety'>, referenceDate = new Date()): number {
    const family = this.speciesNormalizationService.resolveSpeciesFamily(plant);
    const month = referenceDate.getUTCMonth() + 1;
    const cycleStartMonth = this.getCycleStartMonth(family);
    const year = referenceDate.getUTCFullYear();
    return month < cycleStartMonth ? year - 1 : year;
  }

  private getCycleStartMonth(speciesFamily: string): number {
    switch (speciesFamily) {
      case 'mango':
      case 'litchi':
        return 11;
      case 'citrus':
        return 7;
      case 'guava':
      case 'pomegranate':
        return 6;
      case 'banana':
        return 1;
      default:
        return 1;
    }
  }

  private async syncTreeMilestonesFromLog(
    tx: Prisma.TransactionClient,
    plant: Plant,
    logType: LogType,
    eventAt: Date,
  ) {
    const milestoneData: Record<string, Date> = {};

    if (logType === LogType.FLOWERING && !plant.first_flowering_at) {
      milestoneData.first_flowering_at = eventAt;
    }

    if (logType === LogType.FRUIT_SET && !plant.first_fruit_set_at) {
      milestoneData.first_fruit_set_at = eventAt;
    }

    if (logType === LogType.HARVEST) {
      if (!plant.first_harvest_at) {
        milestoneData.first_harvest_at = eventAt;
      }
      milestoneData.latest_harvest_at = eventAt;
    }

    if (Object.keys(milestoneData).length > 0) {
      await tx.plant.update({
        where: { id: plant.id },
        data: milestoneData,
      });
    }
  }

  private async refreshCycleSummary(tx: Prisma.TransactionClient, treeId: string, cycleId: string) {
    const journal_entries = await tx.journalEntry.findMany({
      where: { plant_id: treeId, plant_cycle_id: cycleId },
      orderBy: { timestamp: 'asc' },
    });

    const flowering = journal_entries.find((log) => log.type === LogType.FLOWERING)?.timestamp ?? null;
    const fruitSet = journal_entries.find((log) => log.type === LogType.FRUIT_SET)?.timestamp ?? null;
    const harvestLogs = journal_entries.filter((log) => log.type === LogType.HARVEST);
    const flowerDropLevel = this.maxDropLevel(
      journal_entries
        .filter((log) => log.type === LogType.FLOWER_DROP)
        .map((log) => this.parseDropLevel(log.metadata, 'severity')),
    );
    const fruitDropLevel = this.maxDropLevel(
      journal_entries
        .filter((log) => log.type === LogType.FRUIT_DROP)
        .map((log) => this.parseDropLevel(log.metadata, 'severity')),
    );
    const latestHarvestMetadata = harvestLogs.at(-1)?.metadata as Record<string, unknown> | null | undefined;
    const yieldQuantity = this.parseQuantityValue(
      latestHarvestMetadata?.quantity_value ?? latestHarvestMetadata?.quantity,
    );
    const yieldUnit = this.parseQuantityUnit(
      latestHarvestMetadata?.quantity_unit ?? latestHarvestMetadata?.quantity,
    );
    const yieldQuality = this.parseYieldQuality(latestHarvestMetadata?.quality);
    const stressScore = journal_entries.filter((log) => log.type === LogType.WATERING_STRESS).length;
    const pestPressureScore = journal_entries.filter((log) => log.type === LogType.PEST_DIAGNOSIS).length;
    const treatmentCount = journal_entries.filter((log) => log.type === LogType.TREATMENT).length;

    const summary = this.buildCycleSummary({
      flowering,
      fruitSet,
      harvestCount: harvestLogs.length,
      flowerDropLevel,
      fruitDropLevel,
      stressScore,
      pestPressureScore,
    });

    const nextActions = this.buildRecommendedActions({
      flowering,
      fruitSet,
      harvestCount: harvestLogs.length,
      flowerDropLevel,
      fruitDropLevel,
      stressScore,
      pestPressureScore,
      treatmentCount,
    });

    await tx.plantCycle.update({
      where: { id: cycleId },
      data: {
        observed_flowering_at: flowering,
        observed_fruit_set_at: fruitSet,
        harvest_started_at: harvestLogs[0]?.timestamp ?? null,
        harvest_completed_at: harvestLogs.at(-1)?.timestamp ?? null,
        yield_quantity: yieldQuantity,
        yield_unit: yieldUnit,
        yield_quality: yieldQuality,
        flower_drop_level: flowerDropLevel,
        fruit_drop_level: fruitDropLevel,
        stress_score: stressScore,
        pest_pressure_score: pestPressureScore,
        treatment_count: treatmentCount,
        cycle_summary: summary,
        recommended_next_cycle_actions: nextActions,
      },
    });
  }

  private parseDropLevel(metadata: unknown, key: string): DropLevel {
    const value = (metadata as Record<string, unknown> | null | undefined)?.[key];
    if (typeof value !== 'string') return DropLevel.UNKNOWN;
    switch (value.toUpperCase()) {
      case 'LOW':
        return DropLevel.LOW;
      case 'MEDIUM':
        return DropLevel.MEDIUM;
      case 'HIGH':
        return DropLevel.HIGH;
      case 'NONE':
        return DropLevel.NONE;
      default:
        return DropLevel.UNKNOWN;
    }
  }

  private maxDropLevel(levels: DropLevel[]): DropLevel {
    const rank: Record<DropLevel, number> = {
      [DropLevel.NONE]: 0,
      [DropLevel.LOW]: 1,
      [DropLevel.MEDIUM]: 2,
      [DropLevel.HIGH]: 3,
      [DropLevel.UNKNOWN]: -1,
    };

    return levels.reduce((current, level) => (rank[level] > rank[current] ? level : current), DropLevel.UNKNOWN);
  }

  private parseQuantityValue(quantity: unknown): number | null {
    if (typeof quantity === 'number') return quantity;
    if (typeof quantity !== 'string') return null;
    const match = quantity.match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
  }

  private parseQuantityUnit(quantity: unknown): string | null {
    if (typeof quantity === 'string' && /^[A-Za-z ]+$/.test(quantity.trim())) {
      return quantity.trim();
    }
    if (typeof quantity !== 'string') return null;
    const match = quantity.match(/\d+(?:\.\d+)?\s*(.*)$/);
    const unit = match?.[1]?.trim();
    return unit ? unit : null;
  }

  private parseYieldQuality(quality: unknown): YieldQuality {
    if (typeof quality !== 'string') return YieldQuality.UNKNOWN;
    switch (quality.toUpperCase()) {
      case 'POOR':
        return YieldQuality.POOR;
      case 'FAIR':
        return YieldQuality.FAIR;
      case 'GOOD':
        return YieldQuality.GOOD;
      case 'EXCELLENT':
        return YieldQuality.EXCELLENT;
      default:
        return YieldQuality.UNKNOWN;
    }
  }

  private buildCycleSummary(input: {
    flowering: Date | null;
    fruitSet: Date | null;
    harvestCount: number;
    flowerDropLevel: DropLevel;
    fruitDropLevel: DropLevel;
    stressScore: number;
    pestPressureScore: number;
  }): string {
    const parts: string[] = [];

    if (input.flowering) {
      parts.push('Flowering was recorded')
    } else {
      parts.push('No flowering record was added')
    }

    if (input.fruitSet) {
      parts.push('fruit set was observed')
    } else if (input.flowering) {
      parts.push('but fruit set was not confirmed')
    }

    if (input.harvestCount > 0) {
      parts.push(`and ${input.harvestCount} harvest event${input.harvestCount > 1 ? 's were' : ' was'} logged`)
    }

    if (input.flowerDropLevel === DropLevel.HIGH || input.fruitDropLevel === DropLevel.HIGH) {
      parts.push('with high drop pressure during the cycle')
    }

    if (input.stressScore > 0 || input.pestPressureScore > 0) {
      parts.push(`while ${input.stressScore} stress and ${input.pestPressureScore} pest signals were recorded`)
    }

    return `${parts.join(' ')}.`;
  }

  private buildRecommendedActions(input: {
    flowering: Date | null;
    fruitSet: Date | null;
    harvestCount: number;
    flowerDropLevel: DropLevel;
    fruitDropLevel: DropLevel;
    stressScore: number;
    pestPressureScore: number;
    treatmentCount: number;
  }): string[] {
    const actions: string[] = [];

    if (input.flowering && !input.fruitSet) {
      actions.push('Inspect flowering closely next cycle and confirm fruit set early.');
    }

    if (input.flowerDropLevel === DropLevel.MEDIUM || input.flowerDropLevel === DropLevel.HIGH) {
      actions.push('Track flower drop severity early and stabilize watering during bloom.');
    }

    if (input.fruitDropLevel === DropLevel.MEDIUM || input.fruitDropLevel === DropLevel.HIGH) {
      actions.push('Watch fruit retention next cycle and log drop before harvest declines.');
    }

    if (input.stressScore > 0) {
      actions.push('Plan moisture checks around flowering and fruit-development windows.');
    }

    if (input.pestPressureScore > 0 && input.treatmentCount === 0) {
      actions.push('Add a follow-up treatment or inspection plan when pests are recorded.');
    }

    if (input.harvestCount === 0) {
      actions.push('Keep recording flowering, fruit set, and harvest to compare the next cycle properly.');
    }

    return actions.slice(0, 4);
  }

  private defaultTaskTitle(type: string): string {
    switch (type) {
      case 'WATER':
        return 'Water the plant';
      case 'INSPECT':
        return 'Inspect the plant';
      case 'OBSERVE':
        return 'Observe the plant';
      case 'PRUNE':
        return 'Prune the plant';
      case 'FEED':
        return 'Feed the plant';
      case 'HARVEST':
        return 'Prepare for harvest';
      case 'TREAT':
        return 'Apply treatment';
      default:
        return 'Plant task';
    }
  }

  private async createFollowUpTaskForLog(
    tx: Prisma.TransactionClient,
    treeId: string,
    cycleId: string,
    treeName: string,
    log: { id: string; type: LogType; content: string | null; timestamp: Date },
  ) {
    const followUp = this.getFollowUpTaskTemplate(treeName, log);
    if (!followUp) return;

    await tx.task.create({
      data: {
        plant_id: treeId,
        plant_cycle_id: cycleId,
        type: followUp.type,
        title: followUp.title,
        category: followUp.category,
        priority: followUp.priority,
        source: TaskSource.MANUAL,
        source_key: `log:${log.id}:${followUp.type}`,
        reason: followUp.reason,
        metadata: {
          origin_log_id: log.id,
          origin_log_type: log.type,
          origin_log_content: log.content,
        } as Prisma.InputJsonValue,
        due_date: new Date(log.timestamp.getTime() + followUp.dueInDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  private getFollowUpTaskTemplate(
    treeName: string,
    log: { id: string; type: LogType; content: string | null; timestamp: Date },
  ): {
    type: TaskType;
    category: TaskCategory;
    priority: TaskPriority;
    title: string;
    reason: string;
    dueInDays: number;
  } | null {
    switch (log.type) {
      case LogType.DIAGNOSIS:
        return {
          type: TaskType.INSPECT,
          category: TaskCategory.INSPECTION,
          priority: TaskPriority.HIGH,
          title: `Recheck diagnosis on ${treeName}`,
          reason: 'A diagnosis was recorded and needs a follow-up inspection.',
          dueInDays: 2,
        };
      case LogType.PEST_DIAGNOSIS:
        return {
          type: TaskType.TREAT,
          category: TaskCategory.TREATMENT,
          priority: TaskPriority.HIGH,
          title: `Plan pest response for ${treeName}`,
          reason: 'A pest diagnosis was logged and needs treatment follow-up.',
          dueInDays: 1,
        };
      case LogType.TREATMENT:
        return {
          type: TaskType.INSPECT,
          category: TaskCategory.INSPECTION,
          priority: TaskPriority.MEDIUM,
          title: `Recheck treatment outcome on ${treeName}`,
          reason: 'Treatment was applied and the plant should be checked for recovery.',
          dueInDays: 3,
        };
      default:
        return null;
    }
  }

  private buildTaskSourceSummary(task: {
    source: string;
    metadata?: Prisma.JsonValue | null;
    seasonal_pack?: { current_phase: string | null; upcoming_phase: string | null } | null;
    personalized_overlay?: { reasoning_summary: string | null; adjusted_phase: string | null } | null;
  }): string | null {
    if (task.source === 'MANUAL') {
      const metadata = task.metadata as Record<string, unknown> | null | undefined;
      const originType = typeof metadata?.origin_log_type === 'string' ? metadata.origin_log_type : null;
      const originContent = typeof metadata?.origin_log_content === 'string' ? metadata.origin_log_content : null;
      if (originType && originContent) {
        return `Created from ${originType.toLowerCase().replace(/_/g, ' ')} log: ${originContent}`;
      }
      if (originType) {
        return `Created from ${originType.toLowerCase().replace(/_/g, ' ')} follow-up.`;
      }
      return 'Created from a plant log follow-up.';
    }

    if (task.source === 'PERSONALIZED_OVERLAY') {
      return (
        task.personalized_overlay?.reasoning_summary ??
        (task.personalized_overlay?.adjusted_phase
          ? `Personalized guidance for ${task.personalized_overlay.adjusted_phase.replace(/_/g, ' ')}.`
          : 'Personalized plant guidance.')
      );
    }

    if (task.source === 'SEASONAL_PACK') {
      const currentPhase = task.seasonal_pack?.current_phase?.replace(/_/g, ' ');
      const upcomingPhase = task.seasonal_pack?.upcoming_phase?.replace(/_/g, ' ');
      if (currentPhase && upcomingPhase) {
        return `Seasonal guidance for ${currentPhase}, with ${upcomingPhase} coming next.`;
      }
      return 'Seasonal guidance for the current plant phase.';
    }

    return null;
  }

  private mapTask(task: {
    id: string;
    type: TaskType;
    title: string | null;
    category: TaskCategory | null;
    priority: TaskPriority;
    status: TaskStatus;
    source: TaskSource;
    reason: string | null;
    due_date: Date;
    completed_at: Date | null;
    plant_cycle_id: string | null;
    plant_cycle?: { cycle_year: number } | null;
    plant?: { id: string; name: string; record_kind: string } | null;
    seasonal_pack?: { current_phase: string | null; upcoming_phase: string | null } | null;
    personalized_overlay?: { reasoning_summary: string | null; adjusted_phase: string | null } | null;
  }) {
    return {
      id: task.id,
      type: task.type,
      title: task.title ?? this.defaultTaskTitle(task.type),
      category: task.category,
      priority: task.priority,
      status: task.status,
      source: task.source,
      reason: task.reason,
      due_date: task.due_date,
      completed_at: task.completed_at,
      plant_id: task.plant?.id ?? null,
      tree_name: task.plant?.name ?? null,
      record_kind: task.plant?.record_kind ?? null,
      plant_cycle_id: task.plant_cycle_id,
      cycle_year: task.plant_cycle?.cycle_year ?? null,
      source_summary: this.buildTaskSourceSummary(task),
    };
  }

  private rankLikelyIssues(
    latest: {
      fruit_drop_level: DropLevel;
      flower_drop_level: DropLevel;
      stress_score: number | null;
      pest_pressure_score: number | null;
      observed_flowering_at: Date | null;
      observed_fruit_set_at: Date | null;
      harvest_completed_at: Date | null;
    } | null,
    previous: {
      observed_fruit_set_at: Date | null;
      harvest_completed_at: Date | null;
      stress_score: number | null;
      pest_pressure_score: number | null;
    } | null,
    journal_entries: Array<{ type: LogType; content: string | null }>,
    tasks: Array<{ status: TaskStatus; title: string | null }>,
    cycleLogs: Array<{ type: LogType; metadata: Prisma.JsonValue | null }>,
  ): string[] {
    const issues: string[] = [];
    if (!latest) return issues;

    if (latest.observed_flowering_at && !latest.observed_fruit_set_at) {
      issues.push('Flowering was recorded but fruit set was not confirmed.');
    }

    if (latest.flower_drop_level === DropLevel.HIGH || latest.flower_drop_level === DropLevel.MEDIUM) {
      issues.push(`Flower drop was ${latest.flower_drop_level.toLowerCase()} and likely reduced conversion to fruit set.`);
    }

    if (latest.fruit_drop_level === DropLevel.HIGH || latest.fruit_drop_level === DropLevel.MEDIUM) {
      issues.push(`Fruit drop was ${latest.fruit_drop_level.toLowerCase()} and likely weakened harvest outcome.`);
    }

    if ((latest.stress_score ?? 0) > 0) {
      issues.push(`Water or weather stress signals were recorded ${latest.stress_score} time(s) this cycle.`);
    }

    if ((latest.pest_pressure_score ?? 0) > 0) {
      issues.push(`Pest pressure was recorded ${latest.pest_pressure_score} time(s) this cycle.`);
    }

    if (previous && (latest.stress_score ?? 0) > (previous.stress_score ?? 0)) {
      issues.push('Stress pressure increased compared with the previous cycle.');
    }

    if (previous && (latest.pest_pressure_score ?? 0) > (previous.pest_pressure_score ?? 0)) {
      issues.push('Pest pressure increased compared with the previous cycle.');
    }

    if (journal_entries.some((log) => log.type === LogType.DIAGNOSIS || log.type === LogType.PEST_DIAGNOSIS)) {
      issues.push('Recent diagnosis activity suggests unresolved health stress may still be affecting recovery.');
    }

    const harvestLossCategory = this.extractHarvestLossCategory(cycleLogs);
    if (harvestLossCategory) {
      issues.push(`Harvest loss was linked to ${harvestLossCategory.replace(/_/g, ' ').toLowerCase()}.`);
    }

    const skippedTasks = tasks.filter((task) => task.status === TaskStatus.SKIPPED).length;
    if (skippedTasks > 0) {
      issues.push(`${skippedTasks} cycle task(s) were skipped, which may have reduced early intervention.`);
    }

    return Array.from(new Set(issues)).slice(0, 4);
  }

  private buildWhatToChange(
    latest: {
      observed_flowering_at: Date | null;
      observed_fruit_set_at: Date | null;
      stress_score: number | null;
      pest_pressure_score: number | null;
      flower_drop_level: DropLevel;
      fruit_drop_level: DropLevel;
    } | null,
    previous: {
      observed_fruit_set_at: Date | null;
      harvest_completed_at: Date | null;
    } | null,
    journal_entries: Array<{ type: LogType; content: string | null }>,
    tasks: Array<{ status: TaskStatus; title: string | null }>,
    cycleLogs: Array<{ type: LogType; metadata: Prisma.JsonValue | null }>,
  ): string[] {
    const actions: string[] = [];
    if (!latest) return actions;

    if (latest.observed_flowering_at && !latest.observed_fruit_set_at) {
      actions.push('Confirm fruit set early next cycle instead of waiting until harvest time to assess outcome.');
    }
    if ((latest.stress_score ?? 0) > 0) {
      actions.push('Stabilize watering and moisture checks before flowering and during early fruit development.');
    }
    if ((latest.pest_pressure_score ?? 0) > 0) {
      actions.push('Start pest scouting earlier and follow diagnosis journal_entries with a same-cycle treatment or inspection.');
    }
    if (latest.flower_drop_level === DropLevel.HIGH || latest.flower_drop_level === DropLevel.MEDIUM) {
      actions.push('Track flower drop as soon as bloom starts so intervention is not delayed.');
    }
    if (latest.fruit_drop_level === DropLevel.HIGH || latest.fruit_drop_level === DropLevel.MEDIUM) {
      actions.push('Inspect fruit retention earlier and log drop severity before the harvest window is affected.');
    }
    if (previous?.harvest_completed_at != null && latest.observed_fruit_set_at == null) {
      actions.push('Use last cycle as a benchmark and review what changed before flowering this year.');
    }
    if (journal_entries.some((log) => log.type === LogType.TREATMENT)) {
      actions.push('Recheck treatment outcomes consistently so the next cycle starts from a cleaner health baseline.');
    }
    if (tasks.some((task) => task.status === TaskStatus.SKIPPED)) {
      actions.push('Avoid skipping early-cycle tasks next time, especially inspection and treatment follow-ups.');
    }
    const harvestLossCategory = this.extractHarvestLossCategory(cycleLogs);
    if (harvestLossCategory === 'CRACKING') {
      actions.push('Prepare rain and irrigation stability around harvest to reduce cracking losses.');
    } else if (harvestLossCategory === 'PEST_DAMAGE') {
      actions.push('Protect the harvest earlier with pest checks before fruit quality starts dropping.');
    } else if (harvestLossCategory === 'ROT') {
      actions.push('Reduce post-rain disease pressure and inspect fruit quality earlier in the harvest window.');
    }

    return Array.from(new Set(actions)).slice(0, 4);
  }

  private buildWatchEarly(
    latest: {
      flower_drop_level: DropLevel;
      fruit_drop_level: DropLevel;
      stress_score: number | null;
      pest_pressure_score: number | null;
    } | null,
    journal_entries: Array<{ type: LogType; content: string | null }>,
    cycleLogs: Array<{ type: LogType; metadata: Prisma.JsonValue | null }>,
  ): string[] {
    const watch: string[] = [];
    if (!latest) return watch;

    if ((latest.stress_score ?? 0) > 0) {
      watch.push('Early leaf wilt, dry soil, and repeated watering stress signals.')
    }
    if ((latest.pest_pressure_score ?? 0) > 0) {
      watch.push('Recurring pest symptoms before flowering and fruit set.')
    }
    if (latest.flower_drop_level === DropLevel.HIGH || latest.flower_drop_level === DropLevel.MEDIUM) {
      watch.push('Flower drop in the first bloom window.')
    }
    if (latest.fruit_drop_level === DropLevel.HIGH || latest.fruit_drop_level === DropLevel.MEDIUM) {
      watch.push('Fruit drop shortly after set.')
    }
    if (journal_entries.some((log) => log.type === LogType.DIAGNOSIS)) {
      watch.push('Any repeat of the last diagnosis symptoms before the cycle stabilizes.')
    }
    const harvestLossCategory = this.extractHarvestLossCategory(cycleLogs);
    if (harvestLossCategory === 'BIRD_DAMAGE') {
      watch.push('Early bird damage signs close to harvest maturity.')
    } else if (harvestLossCategory === 'WEATHER_DAMAGE') {
      watch.push('Rain, wind, or heat events close to fruit maturity.')
    }

    return Array.from(new Set(watch)).slice(0, 4);
  }

  private buildPriorityActions(
    latest: {
      observed_flowering_at: Date | null;
      observed_fruit_set_at: Date | null;
      stress_score: number | null;
      pest_pressure_score: number | null;
    } | null,
    previous: {
      observed_fruit_set_at: Date | null;
      harvest_completed_at: Date | null;
    } | null,
    journal_entries: Array<{ type: LogType; content: string | null }>,
    tasks: Array<{ status: TaskStatus; title: string | null }>,
    cycleLogs: Array<{ type: LogType; metadata: Prisma.JsonValue | null }>,
  ): string[] {
    const actions: string[] = [];
    if (!latest) return actions;

    actions.push('Review this cycle before the next flowering window starts.');
    if ((latest.stress_score ?? 0) > 0) {
      actions.push('Set one moisture-check task before bloom and one during early fruit development.');
    }
    if ((latest.pest_pressure_score ?? 0) > 0 || journal_entries.some((log) => log.type === LogType.PEST_DIAGNOSIS)) {
      actions.push('Schedule an early pest inspection instead of waiting for visible damage.');
    }
    if (latest.observed_flowering_at && !latest.observed_fruit_set_at) {
      actions.push('Log flower-to-fruit conversion explicitly next cycle to catch weak set earlier.');
    }
    if (previous?.harvest_completed_at != null) {
      actions.push('Compare the next cycle against the last successful harvest, not just current symptoms.');
    }
    if (tasks.some((task) => task.status === TaskStatus.PENDING)) {
      actions.push('Close or review pending cycle tasks before the next flowering window opens.');
    }
    if (this.extractHarvestLossCategory(cycleLogs)) {
      actions.push('Log harvest loss causes with more detail next cycle so mitigation stays specific.');
    }

    return Array.from(new Set(actions)).slice(0, 4);
  }

  private buildMitigationSummary(
    latest: { cycle_year: number } | null,
    previous: { cycle_year: number } | null,
    issues: string[],
  ): string {
    if (!latest) {
      return 'Not enough cycle history yet to generate a mitigation plan.';
    }

    if (issues.length === 0) {
      return previous
        ? `Cycle ${latest.cycle_year} does not show a clear failure pattern against ${previous.cycle_year}, so the next step is to keep logging key milestones more consistently.`
        : `Cycle ${latest.cycle_year} does not yet show a strong failure pattern; keep logging flowering, fruit set, stress, and harvest to strengthen the next plan.`;
    }

    return previous
      ? `Cycle ${latest.cycle_year} shows signals that can be improved before the next cycle, using ${previous.cycle_year} as the comparison baseline.`
      : `Cycle ${latest.cycle_year} already shows enough signals to guide what should change before the next cycle.`;
  }

  private extractHarvestLossCategory(
    journal_entries: Array<{ type: LogType; metadata: Prisma.JsonValue | null }>,
  ): string | null {
    const harvestMetadata = journal_entries
      .filter((log) => log.type === LogType.HARVEST)
      .map((log) => log.metadata as Record<string, unknown> | null | undefined)
      .find((metadata) => typeof metadata?.loss_category === 'string');

    return typeof harvestMetadata?.loss_category === 'string' ? harvestMetadata.loss_category : null;
  }
}
