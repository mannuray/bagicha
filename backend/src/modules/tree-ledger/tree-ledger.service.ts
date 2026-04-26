import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTreeDto } from './dto/create-tree.dto';
import { AddLogDto } from './dto/add-log.dto';
import { LifecycleService } from './services/lifecycle.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UpdateTreeDto } from './dto/update-tree.dto';
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
  Tree,
  YieldQuality,
} from '@prisma/client';

interface ParsedPlantingDate {
  date: Date | null;
  precision: PlantingDatePrecision;
  input: string | null;
}

@Injectable()
export class TreeLedgerService {
  constructor(
    private prisma: PrismaService,
    private lifecycleService: LifecycleService,
    private seasonalIntelligenceService: SeasonalIntelligenceService,
    private speciesNormalizationService: SpeciesNormalizationService,
    @InjectQueue('task-generation') private taskQueue: Queue,
  ) {}

  async createTree(userId: string, createTreeDto: CreateTreeDto) {
    const parsedPlantingDate = this.parsePlantingDate(
      createTreeDto.planting_date,
      createTreeDto.planting_date_precision,
    );
    const initialStage =
      createTreeDto.lifecycle_stage ??
      this.lifecycleService.calculateStage(parsedPlantingDate.date, createTreeDto.species);
    const manualStage = !!createTreeDto.lifecycle_stage;

    const tree = await this.prisma.tree.create({
      data: {
        user_id: userId,
        name: createTreeDto.name,
        species: createTreeDto.species,
        variety: createTreeDto.variety,
        record_kind: createTreeDto.record_kind,
        type: createTreeDto.type,
        growth_habit: createTreeDto.growth_habit,
        record_pattern: createTreeDto.record_pattern,
        planting_date: parsedPlantingDate.date,
        planting_date_precision: parsedPlantingDate.precision,
        planting_date_input: parsedPlantingDate.input,
        lifecycle_stage: initialStage,
        lifecycle_stage_manual: manualStage,
      },
    });

    // Trigger task generation background job
    await this.taskQueue.add('generate', {
      tree_id: tree.id,
      lifecycle_stage: tree.lifecycle_stage,
      species: tree.species,
    });

    return tree;
  }

  async getTrees(userId: string) {
    return this.prisma.tree.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getTreeDetail(userId: string, treeId: string) {
    const tree = await this.prisma.tree.findUnique({
      where: { id: treeId },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    });

    if (!tree) throw new NotFoundException('Tree not found');
    if (tree.user_id !== userId) throw new ForbiddenException('Access denied');

    if (!tree.lifecycle_stage_manual) {
      const currentStage = this.lifecycleService.calculateStage(tree.planting_date, tree.species);

      if (currentStage !== tree.lifecycle_stage) {
        await this.prisma.tree.update({
          where: { id: treeId },
          data: { lifecycle_stage: currentStage },
        });

        await this.taskQueue.add('generate', {
          tree_id: tree.id,
          lifecycle_stage: currentStage,
          species: tree.species,
        });

        tree.lifecycle_stage = currentStage;
      }
    }

    return tree;
  }

  async updateTree(userId: string, treeId: string, updateTreeDto: UpdateTreeDto) {
    const tree = await this.getTreeDetail(userId, treeId);

    const parsedPlantingDate =
      updateTreeDto.planting_date === undefined && updateTreeDto.planting_date_precision === undefined
        ? {
            date: tree.planting_date,
            precision: tree.planting_date_precision,
            input: tree.planting_date_input,
          }
        : this.parsePlantingDate(
            updateTreeDto.planting_date,
            updateTreeDto.planting_date_precision ?? undefined,
          );

    const species = updateTreeDto.species ?? tree.species;
    const lifecycleStage =
      updateTreeDto.lifecycle_stage ??
      this.lifecycleService.calculateStage(parsedPlantingDate.date, species);
    const manualStage = !!updateTreeDto.lifecycle_stage;

    const updatedTree = await this.prisma.tree.update({
      where: { id: treeId },
      data: {
        name: updateTreeDto.name ?? undefined,
        species: updateTreeDto.species ?? undefined,
        variety: updateTreeDto.variety ?? undefined,
        record_kind: updateTreeDto.record_kind ?? undefined,
        type: updateTreeDto.type ?? undefined,
        growth_habit: updateTreeDto.growth_habit ?? undefined,
        record_pattern: updateTreeDto.record_pattern ?? undefined,
        planting_date: parsedPlantingDate.date,
        planting_date_precision: parsedPlantingDate.precision,
        planting_date_input: parsedPlantingDate.input,
        lifecycle_stage: lifecycleStage,
        lifecycle_stage_manual: manualStage,
      },
    });

    await this.taskQueue.add('generate', {
      tree_id: updatedTree.id,
      lifecycle_stage: updatedTree.lifecycle_stage,
      species: updatedTree.species,
    });

    return updatedTree;
  }

  async addLog(userId: string, treeId: string, addLogDto: AddLogDto) {
    const tree = await this.getTreeDetail(userId, treeId);

    return this.prisma.$transaction(async (tx) => {
      const eventAt = addLogDto.event_at ? new Date(addLogDto.event_at) : new Date();
      const cycleYear = this.resolveCycleYear(tree, eventAt);
      const cycle = await tx.treeCycle.upsert({
        where: {
          tree_cycle_year: {
            tree_id: tree.id,
            cycle_year: cycleYear,
          },
        },
        create: {
          tree_id: tree.id,
          cycle_year: cycleYear,
        },
        update: {},
      });

      const { event_at, ...logData } = addLogDto;

      const log = await tx.log.create({
        data: {
          ...logData,
          tree_id: tree.id,
          tree_cycle_id: cycle.id,
          timestamp: eventAt,
        },
      });

      await this.syncTreeMilestonesFromLog(tx, tree, log.type, log.timestamp);
      await this.refreshCycleSummary(tx, tree.id, cycle.id);
      await this.createFollowUpTaskForLog(tx, tree.id, cycle.id, tree.name, log);

      return log;
    });
  }

  async getTimeline(userId: string, treeId: string, page = 1, pageSize = 20) {
    const tree = await this.getTreeDetail(userId, treeId);

    const logs = await this.prisma.log.findMany({
      where: { tree_id: tree.id },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalItems = await this.prisma.log.count({
      where: { tree_id: tree.id },
    });

    return {
      items: logs,
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
    const tree = await this.getTreeDetail(userId, treeId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        district: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.seasonalIntelligenceService.inferTreeSeasonalState(tree, user);
  }

  async getCycles(userId: string, treeId: string) {
    await this.getTreeDetail(userId, treeId);

    const cycles = await this.prisma.treeCycle.findMany({
      where: { tree_id: treeId },
      include: {
        logs: {
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
      recent_events: cycle.logs.map((log) => ({
        id: log.id,
        type: log.type,
        content: log.content,
        timestamp: log.timestamp,
      })),
    }));
  }

  async getTasks(userId: string, treeId: string) {
    await this.getTreeDetail(userId, treeId);

    const tasks = await this.prisma.task.findMany({
      where: { tree_id: treeId },
      include: {
        tree_cycle: {
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
        tree: {
          user_id: userId,
        },
      },
      include: {
        tree: {
          select: {
            id: true,
            name: true,
            record_kind: true,
          },
        },
        tree_cycle: {
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
    await this.getTreeDetail(userId, treeId);

    const cycles = await this.prisma.treeCycle.findMany({
      where: { tree_id: treeId },
      orderBy: { cycle_year: 'desc' },
      take: 2,
    });

    const recentHealthLogs = await this.prisma.log.findMany({
      where: {
        tree_id: treeId,
        type: {
          in: [LogType.DIAGNOSIS, LogType.PEST_DIAGNOSIS, LogType.TREATMENT, LogType.WATERING_STRESS],
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 6,
    });
    const latestCycleLogs = cycles[0]
      ? await this.prisma.log.findMany({
          where: { tree_id: treeId, tree_cycle_id: cycles[0].id },
          orderBy: { timestamp: 'desc' },
          take: 12,
        })
      : [];

    const latestCycleTasks = cycles[0]
      ? await this.prisma.task.findMany({
          where: { tree_id: treeId, tree_cycle_id: cycles[0].id },
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
    await this.getTreeDetail(userId, treeId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.tree_id !== treeId) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completed_at: status === TaskStatus.COMPLETED ? new Date() : null,
      },
      include: {
        tree_cycle: {
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
      tree_cycle_id: updated.tree_cycle_id,
      cycle_year: updated.tree_cycle?.cycle_year ?? null,
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

  private resolveCycleYear(tree: Pick<Tree, 'name' | 'species' | 'variety'>, referenceDate = new Date()): number {
    const family = this.speciesNormalizationService.resolveSpeciesFamily(tree);
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
    tree: Tree,
    logType: LogType,
    eventAt: Date,
  ) {
    const milestoneData: Record<string, Date> = {};

    if (logType === LogType.FLOWERING && !tree.first_flowering_at) {
      milestoneData.first_flowering_at = eventAt;
    }

    if (logType === LogType.FRUIT_SET && !tree.first_fruit_set_at) {
      milestoneData.first_fruit_set_at = eventAt;
    }

    if (logType === LogType.HARVEST) {
      if (!tree.first_harvest_at) {
        milestoneData.first_harvest_at = eventAt;
      }
      milestoneData.latest_harvest_at = eventAt;
    }

    if (Object.keys(milestoneData).length > 0) {
      await tx.tree.update({
        where: { id: tree.id },
        data: milestoneData,
      });
    }
  }

  private async refreshCycleSummary(tx: Prisma.TransactionClient, treeId: string, cycleId: string) {
    const logs = await tx.log.findMany({
      where: { tree_id: treeId, tree_cycle_id: cycleId },
      orderBy: { timestamp: 'asc' },
    });

    const flowering = logs.find((log) => log.type === LogType.FLOWERING)?.timestamp ?? null;
    const fruitSet = logs.find((log) => log.type === LogType.FRUIT_SET)?.timestamp ?? null;
    const harvestLogs = logs.filter((log) => log.type === LogType.HARVEST);
    const flowerDropLevel = this.maxDropLevel(
      logs
        .filter((log) => log.type === LogType.FLOWER_DROP)
        .map((log) => this.parseDropLevel(log.metadata, 'severity')),
    );
    const fruitDropLevel = this.maxDropLevel(
      logs
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
    const stressScore = logs.filter((log) => log.type === LogType.WATERING_STRESS).length;
    const pestPressureScore = logs.filter((log) => log.type === LogType.PEST_DIAGNOSIS).length;
    const treatmentCount = logs.filter((log) => log.type === LogType.TREATMENT).length;

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

    await tx.treeCycle.update({
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
        return 'Water the tree';
      case 'INSPECT':
        return 'Inspect the tree';
      case 'OBSERVE':
        return 'Observe the tree';
      case 'PRUNE':
        return 'Prune the tree';
      case 'FEED':
        return 'Feed the tree';
      case 'HARVEST':
        return 'Prepare for harvest';
      case 'TREAT':
        return 'Apply treatment';
      default:
        return 'Tree task';
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
        tree_id: treeId,
        tree_cycle_id: cycleId,
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
          reason: 'Treatment was applied and the tree should be checked for recovery.',
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
      return 'Created from a tree log follow-up.';
    }

    if (task.source === 'PERSONALIZED_OVERLAY') {
      return (
        task.personalized_overlay?.reasoning_summary ??
        (task.personalized_overlay?.adjusted_phase
          ? `Personalized guidance for ${task.personalized_overlay.adjusted_phase.replace(/_/g, ' ')}.`
          : 'Personalized tree guidance.')
      );
    }

    if (task.source === 'SEASONAL_PACK') {
      const currentPhase = task.seasonal_pack?.current_phase?.replace(/_/g, ' ');
      const upcomingPhase = task.seasonal_pack?.upcoming_phase?.replace(/_/g, ' ');
      if (currentPhase && upcomingPhase) {
        return `Seasonal guidance for ${currentPhase}, with ${upcomingPhase} coming next.`;
      }
      return 'Seasonal guidance for the current tree phase.';
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
    tree_cycle_id: string | null;
    tree_cycle?: { cycle_year: number } | null;
    tree?: { id: string; name: string; record_kind: string } | null;
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
      tree_id: task.tree?.id ?? null,
      tree_name: task.tree?.name ?? null,
      record_kind: task.tree?.record_kind ?? null,
      tree_cycle_id: task.tree_cycle_id,
      cycle_year: task.tree_cycle?.cycle_year ?? null,
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
    logs: Array<{ type: LogType; content: string | null }>,
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

    if (logs.some((log) => log.type === LogType.DIAGNOSIS || log.type === LogType.PEST_DIAGNOSIS)) {
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
    logs: Array<{ type: LogType; content: string | null }>,
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
      actions.push('Start pest scouting earlier and follow diagnosis logs with a same-cycle treatment or inspection.');
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
    if (logs.some((log) => log.type === LogType.TREATMENT)) {
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
    logs: Array<{ type: LogType; content: string | null }>,
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
    if (logs.some((log) => log.type === LogType.DIAGNOSIS)) {
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
    logs: Array<{ type: LogType; content: string | null }>,
    tasks: Array<{ status: TaskStatus; title: string | null }>,
    cycleLogs: Array<{ type: LogType; metadata: Prisma.JsonValue | null }>,
  ): string[] {
    const actions: string[] = [];
    if (!latest) return actions;

    actions.push('Review this cycle before the next flowering window starts.');
    if ((latest.stress_score ?? 0) > 0) {
      actions.push('Set one moisture-check task before bloom and one during early fruit development.');
    }
    if ((latest.pest_pressure_score ?? 0) > 0 || logs.some((log) => log.type === LogType.PEST_DIAGNOSIS)) {
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
    logs: Array<{ type: LogType; metadata: Prisma.JsonValue | null }>,
  ): string | null {
    const harvestMetadata = logs
      .filter((log) => log.type === LogType.HARVEST)
      .map((log) => log.metadata as Record<string, unknown> | null | undefined)
      .find((metadata) => typeof metadata?.loss_category === 'string');

    return typeof harvestMetadata?.loss_category === 'string' ? harvestMetadata.loss_category : null;
  }
}
