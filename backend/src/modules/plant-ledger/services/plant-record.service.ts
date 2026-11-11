import { bloomStatus, perennialFlower } from '../domain/flower-care';
import { climateGroupFor } from '../domain/crop-calendar';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Plant, RecordKind, RegionCluster, User } from '@prisma/client';
import { Queue } from 'bullmq';
import { ConflictError, NotFoundError } from '../../../common/errors';
import { Metrics } from '../../../common/observability';
import {
  Page,
  PageQuery,
  toPage,
  toSkipTake,
} from '../../../common/pagination';
import { Clock } from '../../../common/time';
import { parsePlantingDate } from '../domain/planting-date';
import { CreatePlantDto } from '../dto/create-plant.dto';
import type {
  PlantListStatus,
  PlantListKind,
} from '../dto/list-plants-query.dto';
import { UpdatePlantDto } from '../dto/update-plant.dto';
import {
  TASK_GENERATION_QUEUE,
  TaskGenerationJob,
} from '../processors/task.processor';
import { PlantDetail, PlantRepository } from '../repositories/plant.repository';
import { lifeProfileFor } from '../domain/species-life-profiles';
import { laterStage, LifecycleService } from './lifecycle.service';
import {
  SeasonalIntelligenceService,
  TreeSeasonalState,
} from './seasonal-intelligence.service';
import { SpeciesNormalizationService } from './species-normalization.service';

const plantNotFound = () =>
  new NotFoundError('PLANT_NOT_FOUND', 'Plant not found');

/** Plant records: CRUD, lifecycle stage upkeep, and read models other modules need. */
@Injectable()
export class PlantRecordService implements OnModuleInit {
  constructor(
    private readonly plants: PlantRepository,
    private readonly lifecycle: LifecycleService,
    private readonly seasonalIntelligence: SeasonalIntelligenceService,
    private readonly species: SpeciesNormalizationService,
    private readonly clock: Clock,
    @InjectQueue(TASK_GENERATION_QUEUE) private readonly taskQueue: Queue,
    private readonly metrics: Metrics,
  ) {}

  onModuleInit(): void {
    this.metrics.registerQueueDepth(TASK_GENERATION_QUEUE, async () => {
      const c = await this.taskQueue.getJobCounts(
        'waiting',
        'active',
        'delayed',
      );
      return (c.waiting ?? 0) + (c.active ?? 0) + (c.delayed ?? 0);
    });
  }

  /** The owner's plant, or 404. No side effects — for other modules. */
  /** The owner's plant, refusing writes that would grow the record of an ended tree. */
  async assertGrowing(userId: string, plantId: string): Promise<Plant> {
    const plant = await this.getOwnedOrThrow(userId, plantId);
    if (plant.ended_at) {
      throw new ConflictError(
        'PLANT_ENDED',
        'This tree has ended; restore it to keep growing its record',
      );
    }
    return plant;
  }

  async getOwnedOrThrow(userId: string, plantId: string): Promise<Plant> {
    const plant = await this.plants.findOwned(userId, plantId);
    if (!plant) throw plantNotFound();
    return plant;
  }

  /**
   * The owner's plant (with journal count), recomputing an automatic lifecycle
   * stage first. Ledger routes read plants through this, as before the split.
   */
  async getDetail(userId: string, plantId: string): Promise<PlantDetail> {
    const plant = await this.plants.findOwnedDetail(userId, plantId);
    if (!plant) throw plantNotFound();
    // An ended tree is a record, not a living plant: no stage changes, no new tasks.
    const ended = Boolean(plant.ended_at);
    // Journey crops have their own stages; the tree age clock never applies to them.
    if (!plant.lifecycle_stage_manual && !ended && !plant.crop_id) {
      const stage = laterStage(
        plant.lifecycle_stage,
        this.lifecycle.calculateStage(plant),
      );
      if (stage !== plant.lifecycle_stage) {
        await this.plants.updateOwned(userId, plant.id, {
          lifecycle_stage: stage,
        });
        await this.enqueueTaskGeneration(
          userId,
          plant.id,
          stage,
          plant.species,
        );
        plant.lifecycle_stage = stage;
      }
    }
    return plant;
  }

  /** Plant detail as the API returns it: the plant plus its species life profile. */
  async detailView(user: Pick<User, 'id' | 'region_cluster'>, plantId: string) {
    const plant = await this.getDetail(user.id, plantId);
    return {
      ...plant,
      bloom:
        plant.record_kind === RecordKind.FLOWER && !plant.crop_id
          ? this.bloomFor(plant, user.region_cluster)
          : null,
      life_profile: lifeProfileFor(
        plant.species_family ?? this.species.resolveSpeciesFamily(plant),
      ),
    };
  }

  async list(
    userId: string,
    q: PageQuery & { status?: PlantListStatus; kind?: PlantListKind },
  ): Promise<Page<Plant & { season_started_at: Date | null }>> {
    const { rows, total } = await this.plants.listOwned(
      userId,
      toSkipTake(q),
      q.status ?? 'active',
      q.kind,
    );
    return toPage(rows, total, q);
  }

  async create(userId: string, dto: CreatePlantDto): Promise<Plant> {
    const replaces = dto.replaces_id
      ? await this.getOwnedOrThrow(userId, dto.replaces_id)
      : null;
    if (replaces && !replaces.ended_at) {
      throw new ConflictError(
        'PLANT_NOT_ENDED',
        'Only a tree that has ended can be replaced',
      );
    }
    const planting = parsePlantingDate(
      dto.planting_date,
      dto.planting_date_precision,
      this.clock,
    );
    const stage =
      dto.lifecycle_stage ??
      this.lifecycle.calculateStage({
        planting_date: planting.date,
        species: dto.species,
        record_kind: dto.record_kind,
      });

    const plant = await this.plants.create(userId, {
      name: dto.name,
      species: dto.species,
      variety: dto.variety,
      record_kind: dto.record_kind,
      type: dto.type,
      growth_habit: dto.growth_habit,
      record_pattern: dto.record_pattern,
      planting_date: planting.date,
      planting_date_precision: planting.precision,
      planting_date_input: planting.input,
      lifecycle_stage: stage,
      lifecycle_stage_manual: !!dto.lifecycle_stage,
    });
    await this.enqueueTaskGeneration(
      userId,
      plant.id,
      plant.lifecycle_stage,
      plant.species,
    );
    if (replaces) {
      await this.plants.updateOwned(userId, replaces.id, {
        replaced_by_id: plant.id,
      });
    }
    return plant;
  }

  async update(
    userId: string,
    plantId: string,
    dto: UpdatePlantDto,
  ): Promise<Plant> {
    await this.assertGrowing(userId, plantId);
    const plant = await this.getDetail(userId, plantId);
    const planting =
      dto.planting_date === undefined &&
      dto.planting_date_precision === undefined
        ? {
            date: plant.planting_date,
            precision: plant.planting_date_precision,
            input: plant.planting_date_input,
          }
        : parsePlantingDate(
            dto.planting_date,
            dto.planting_date_precision ?? undefined,
            this.clock,
          );
    const species = dto.species ?? plant.species;
    // Only a corrected planting date or species may recompute freely; any other
    // edit (a rename) must never move an automatic stage backwards.
    const ageInputsChanged =
      dto.planting_date !== undefined ||
      dto.planting_date_precision !== undefined ||
      (dto.species !== undefined && dto.species !== plant.species);
    const computed = this.lifecycle.calculateStage({
      ...plant,
      planting_date: planting.date,
      species,
      species_family: dto.species ? null : plant.species_family,
      record_kind: dto.record_kind ?? plant.record_kind,
    });
    const stage =
      dto.lifecycle_stage ??
      (ageInputsChanged
        ? computed
        : laterStage(plant.lifecycle_stage, computed));

    const updated = await this.plants.updateOwned(userId, plantId, {
      name: dto.name ?? undefined,
      species: dto.species ?? undefined,
      variety: dto.variety ?? undefined,
      record_kind: dto.record_kind ?? undefined,
      type: dto.type ?? undefined,
      growth_habit: dto.growth_habit ?? undefined,
      record_pattern: dto.record_pattern ?? undefined,
      planting_date: planting.date,
      planting_date_precision: planting.precision,
      planting_date_input: planting.input,
      lifecycle_stage: stage,
      lifecycle_stage_manual: !!dto.lifecycle_stage,
    });
    if (!updated) throw plantNotFound();
    await this.enqueueTaskGeneration(
      userId,
      updated.id,
      updated.lifecycle_stage,
      updated.species,
    );
    return updated;
  }

  async getSeasonalState(
    userId: string,
    plantId: string,
  ): Promise<TreeSeasonalState> {
    await this.getDetail(userId, plantId);
    const plant = await this.plants.findOwnedWithOwnerLocation(userId, plantId);
    if (!plant) throw plantNotFound();
    const { user, ...fields } = plant;
    return this.seasonalIntelligence.inferTreeSeasonalState(fields, user);
  }

  /** A perennial flower's usual bloom months for the user's climate (plains when unknown); null if we don't know it. */
  private bloomFor(
    plant: Parameters<SpeciesNormalizationService['resolveSpeciesFamily']>[0],
    region: RegionCluster | null,
  ) {
    const flower = perennialFlower(this.species.resolveSpeciesFamily(plant));
    if (!flower) return null;
    const group = region ? climateGroupFor(region) : 'PLAINS';
    return bloomStatus(flower, group, this.clock.now());
  }

  /** Plant history and season context sent to the AI for diagnosis. */
  async getContextForAi(userId: string, plantId: string) {
    const plant = await this.plants.findOwnedWithContext(userId, plantId);
    if (!plant) throw plantNotFound();
    return {
      plant: {
        id: plant.id,
        name: plant.name,
        species_family: this.species.resolveSpeciesFamily(plant),
        species: plant.species,
        variety: plant.variety,
        lifecycle_stage: plant.lifecycle_stage,
        health_status: plant.health_status,
      },
      location: {
        district: plant.user.district,
        latitude: plant.user.latitude,
        longitude: plant.user.longitude,
      },
      // A perennial flower gets its bloom season, never the fruit-tree phases.
      seasonal_state:
        plant.record_kind === RecordKind.FLOWER && !plant.crop_id
          ? {
              kind: 'perennial_flower' as const,
              bloom: this.bloomFor(plant, plant.user.region_cluster),
            }
          : this.seasonalIntelligence.inferTreeSeasonalState(plant, plant.user),
      recent_cycles: plant.cycles.map((cycle) => ({
        cycle_year: cycle.cycle_year,
        yield_quantity: cycle.yield_quantity,
        yield_unit: cycle.yield_unit,
        yield_quality: cycle.yield_quality,
        flower_drop_level: cycle.flower_drop_level,
        fruit_drop_level: cycle.fruit_drop_level,
        stress_score: cycle.stress_score,
        pest_pressure_score: cycle.pest_pressure_score,
        cycle_summary: cycle.cycle_summary,
      })),
      recent_logs: plant.journal_entries.map((log) => ({
        type: log.type,
        content: log.content,
        metadata: log.metadata,
        timestamp: log.timestamp,
      })),
      recent_diagnoses: plant.diagnosis_outcomes.map((outcome) => ({
        primary_issue: outcome.primary_issue,
        severity: outcome.severity,
        confidence: outcome.confidence,
        reasoning_summary: outcome.reasoning_summary,
        event_at: outcome.event_at,
      })),
      open_tasks: plant.tasks.map((task) => ({
        title: task.title,
        type: task.type,
        status: task.status,
        due_date: task.due_date,
      })),
    };
  }

  private async enqueueTaskGeneration(
    userId: string,
    plantId: string,
    lifecycleStage: string,
    species: string,
  ): Promise<void> {
    const job: TaskGenerationJob = {
      user_id: userId,
      plant_id: plantId,
      lifecycle_stage: lifecycleStage,
      species,
    };
    await this.taskQueue.add('generate', job);
  }
}

export type PlantAiContext = Awaited<
  ReturnType<PlantRecordService['getContextForAi']>
>;
