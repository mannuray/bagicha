import { Injectable } from '@nestjs/common';
import {
  CropStage,
  JournalEntry,
  LogType,
  Plant,
  PlantCycle,
  RegionCluster,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskType,
} from '@prisma/client';
import { NotFoundError } from '../../../common/errors';
import { Tx } from '../../../common/prisma/transaction';
import { addDays, Clock, istYear } from '../../../common/time';
import {
  CatalogueStore,
  type Catalogue,
  type ClimateGroup,
  type CropInfo,
} from '../../catalogue';
import {
  climateGroupFor,
  inGroup,
  titleName,
  windowContaining,
} from '../domain/crop-calendar';
import { cropTitle, type CropTitleRef } from '../domain/task-titles';
import { regionFor } from '../../regions';
import { GardenPlaceRepository } from '../repositories/garden-place.repository';
import { TaskDraft, TaskService } from './task.service';

/** Entry types that can open a crop season (a crop already growing can start at harvest). */
const OPENERS = new Set<LogType>([
  LogType.SOWING,
  LogType.TRANSPLANTING,
  LogType.HARVEST,
]);
/** A flower's bloom log does what a harvest log does for a vegetable. */
const BLOOMS = new Set<LogType>([LogType.FLOWERING, LogType.BLOOM_PEAK]);
const RANK: Record<CropStage, number> = {
  PLANNED: 0,
  RESTING: 0,
  NURSERY: 1,
  IN_GROUND: 2,
  HARVESTING: 3,
};

type Meta = Record<string, unknown> | null;
const metaOf = (m: unknown): Meta =>
  m && typeof m === 'object' && !Array.isArray(m)
    ? (m as Record<string, unknown>)
    : null;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/**
 * The planting journey for calendar crops: which season an entry belongs to,
 * how it moves the crop's stage, and the next steps it creates as tasks.
 * Spec: docs/superpowers/specs/2026-11-11-vegetables-design.md §2.3, §2.4, §6.1.
 */
@Injectable()
export class CropJourneyService {
  constructor(
    private readonly tasks: TaskService,
    private readonly places: GardenPlaceRepository,
    private readonly clock: Clock,
    private readonly catalogue: CatalogueStore,
  ) {}

  /** The open season, or a new one when this entry starts the crop off; null otherwise. */
  async seasonFor(
    tx: Tx,
    userId: string,
    plant: Plant,
    type: LogType,
    metadata: unknown,
    eventAt: Date,
  ): Promise<{ cycle: PlantCycle | null; opened: boolean }> {
    const open = await tx.plantCycle.findFirst({
      where: { plant_id: plant.id, started_at: { not: null }, closed_at: null },
      orderBy: { started_at: 'desc' },
    });
    const opens =
      OPENERS.has(type) ||
      (BLOOMS.has(type) &&
        (await this.catalogue.snapshot()).crop(plant.crop_id)?.kind ===
          'FLOWER');
    if (open || !opens) return { cycle: open, opened: false };
    const placeId = metaOf(metadata)?.place_id;
    if (typeof placeId === 'string') {
      const place = await this.places.findOwned(userId, placeId, tx);
      if (!place) throw new NotFoundError('PLACE_NOT_FOUND', 'Place not found');
    }
    const year = istYear(eventAt);
    const last = await tx.plantCycle.findFirst({
      where: { plant_id: plant.id, cycle_year: year },
      orderBy: { season_no: 'desc' },
    });
    const cycle = await tx.plantCycle.create({
      data: {
        plant_id: plant.id,
        cycle_year: year,
        season_no: (last?.season_no ?? 0) + 1,
        started_at: eventAt,
        place_id: typeof placeId === 'string' ? placeId : null,
      },
    });
    return { cycle, opened: true };
  }

  /** Stage change and next-step tasks after an entry is recorded. */
  async afterEntry(
    tx: Tx,
    userId: string,
    plant: Plant,
    log: JournalEntry,
    cycle: PlantCycle | null,
    opened: boolean,
  ): Promise<void> {
    const catalogue = await this.catalogue.snapshot();
    const listed = catalogue.crop(plant.crop_id);
    if (!listed) return;
    const journey = catalogue.method(listed.method).journey;
    // The region is looked up at most once, and only when an entry needs it.
    let region: Promise<ClimateGroup> | undefined;
    const group = () => (region ??= this.groupOf(tx, userId));
    // Harvest days can differ by region; only sowing and transplanting set them.
    const crop =
      log.type === LogType.SOWING || log.type === LogType.TRANSPLANTING
        ? inGroup(listed, await group())
        : listed;
    const at = log.timestamp;
    const steps = (from: 'SOWING' | 'TRANSPLANTING') =>
      crop.care
        .filter((c) => c.after === from)
        .map((c) =>
          this.draft(
            catalogue,
            crop,
            plant,
            cycle,
            c.key,
            { key: 'care', step: c.key },
            addDays(at, c.days),
          ),
        );

    const type =
      crop.kind === 'FLOWER' && BLOOMS.has(log.type)
        ? LogType.HARVEST
        : log.type;
    switch (type) {
      case LogType.SOWING: {
        if (!opened) {
          // A succession row in an open season: no stage change, no repeated steps.
          await this.completeSteps(tx, plant.id, ['row']);
          await this.createRow(
            tx,
            userId,
            catalogue,
            plant,
            crop,
            cycle,
            at,
            group,
          );
          return;
        }
        const nursery =
          (metaOf(log.metadata)?.method ??
            (journey === 'NURSERY' ? 'NURSERY' : 'DIRECT')) === 'NURSERY';
        await this.setStage(
          tx,
          plant,
          nursery ? CropStage.NURSERY : CropStage.IN_GROUND,
        );
        await this.completeSteps(tx, plant.id, ['seeds', 'sow']);
        const drafts: TaskDraft[] = [
          this.draft(
            catalogue,
            crop,
            plant,
            cycle,
            'germination',
            {
              key: nursery
                ? 'sprout.nursery'
                : journey === 'PLANT'
                  ? 'sprout.plant'
                  : 'sprout.sown',
            },
            addDays(at, crop.germination_days[1]),
            TaskType.INSPECT,
            TaskCategory.INSPECTION,
          ),
          ...steps('SOWING'),
          this.draft(
            catalogue,
            crop,
            plant,
            cycle,
            'harvest_soon',
            this.readySoonTitle(crop),
            addDays(at, crop.days_to_first_harvest[0]),
            ...this.readySoonKind(crop),
          ),
        ];
        if (nursery && crop.transplant_after_days) {
          drafts.push(
            this.draft(
              catalogue,
              crop,
              plant,
              cycle,
              'transplant',
              { key: 'transplant' },
              addDays(at, crop.transplant_after_days[0]),
            ),
          );
        }
        if (!nursery && crop.thin_after_days) {
          drafts.push(
            this.draft(
              catalogue,
              crop,
              plant,
              cycle,
              'thin',
              { key: 'thin' },
              addDays(at, crop.thin_after_days),
            ),
          );
        }
        await this.tasks.createTasks(userId, plant.id, drafts, tx);
        await this.createRow(
          tx,
          userId,
          catalogue,
          plant,
          crop,
          cycle,
          at,
          group,
        );
        return;
      }
      case LogType.TRANSPLANTING: {
        // A nursery crop's bed is chosen at transplant: record it on the season.
        const placeId = metaOf(log.metadata)?.place_id;
        if (cycle && !cycle.place_id && typeof placeId === 'string') {
          if (!(await this.places.findOwned(userId, placeId, tx))) {
            throw new NotFoundError('PLACE_NOT_FOUND', 'Place not found');
          }
          await tx.plantCycle.update({
            where: { id: cycle.id },
            data: { place_id: placeId },
          });
        }
        await this.setStage(tx, plant, CropStage.IN_GROUND);
        await this.completeSteps(tx, plant.id, [
          'seeds',
          'sow',
          'germination',
          'transplant',
          'thin',
        ]);
        const drafts = steps('TRANSPLANTING');
        if (opened) {
          // Bought seedlings: the harvest clock starts from the nursery age they came at.
          const head =
            crop.days_to_first_harvest[0] -
            (crop.transplant_after_days?.[1] ?? 0);
          drafts.push(
            this.draft(
              catalogue,
              crop,
              plant,
              cycle,
              'harvest_soon',
              this.readySoonTitle(crop),
              addDays(at, Math.max(head, 7)),
              ...this.readySoonKind(crop),
            ),
          );
        }
        await this.tasks.createTasks(userId, plant.id, drafts, tx);
        return;
      }
      case LogType.HARVEST:
        await this.setStage(tx, plant, CropStage.HARVESTING);
        await this.completeSteps(tx, plant.id, [
          'seeds',
          'sow',
          'germination',
          'transplant',
          'thin',
          'harvest_soon',
        ]);
        await this.createRow(
          tx,
          userId,
          catalogue,
          plant,
          crop,
          cycle,
          at,
          group,
        );
        return;
      case LogType.GERMINATION:
        await this.completeSteps(tx, plant.id, ['germination']);
        return;
      case LogType.THINNING:
        await this.completeSteps(tx, plant.id, ['thin']);
        return;
      case LogType.SEASON_END:
        // No season open (e.g. a planned crop): nothing to end, and its reminders stay.
        if (!cycle) return;
        await tx.plantCycle.update({
          where: { id: cycle.id },
          data: { closed_at: at },
        });
        await tx.plant.update({
          where: { id: plant.id },
          data: { crop_stage: CropStage.RESTING },
        });
        await tx.task.updateMany({
          where: {
            plant_id: plant.id,
            source: TaskSource.CROP_PLAN,
            status: TaskStatus.PENDING,
          },
          data: { status: TaskStatus.CANCELLED },
        });
        return;
      default:
        return;
    }
  }

  private readySoonTitle(crop: CropInfo): Pick<CropTitleRef, 'key'> {
    return { key: crop.kind === 'FLOWER' ? 'ready.bloom' : 'ready.pick' };
  }

  /** Blooming is something to watch for; picking a vegetable is a harvest. */
  private readySoonKind(crop: CropInfo): [TaskType, TaskCategory] {
    return crop.kind === 'FLOWER'
      ? [TaskType.OBSERVE, TaskCategory.OBSERVATION]
      : [TaskType.HARVEST, TaskCategory.HARVEST];
  }

  /** The gardener's climate group (their region decides sowing windows and some harvest days). */
  private async groupOf(tx: Tx, userId: string) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { region_cluster: true, district: true },
    });
    return climateGroupFor(user ? regionFor(user) : RegionCluster.NORTH_INDIA);
  }

  /** Moves the stage forward only (a new season may start from planned or resting). */
  private async setStage(tx: Tx, plant: Plant, target: CropStage) {
    const current = plant.crop_stage ?? CropStage.PLANNED;
    const waiting =
      current === CropStage.PLANNED || current === CropStage.RESTING;
    if (!waiting && RANK[target] <= RANK[current]) return;
    await tx.plant.update({
      where: { id: plant.id },
      data: { crop_stage: target },
    });
    plant.crop_stage = target;
  }

  /** Marks the plant's pending journey tasks of these steps as done: a later step satisfied them. */
  private async completeSteps(tx: Tx, plantId: string, steps: string[]) {
    const pending = await tx.task.findMany({
      where: {
        plant_id: plantId,
        source: TaskSource.CROP_PLAN,
        status: TaskStatus.PENDING,
      },
    });
    const ids = pending
      .filter((t) => steps.includes(String(metaOf(t.metadata)?.step)))
      .map((t) => t.id);
    if (ids.length > 0) {
      await tx.task.updateMany({
        where: { id: { in: ids } },
        data: { status: TaskStatus.COMPLETED, completed_at: this.clock.now() },
      });
    }
  }

  /** The next "sow another row" for succession crops, while the sowing window is still open. */
  private async createRow(
    tx: Tx,
    userId: string,
    catalogue: Catalogue,
    plant: Plant,
    crop: CropInfo,
    cycle: PlantCycle | null,
    at: Date,
    group: () => Promise<ClimateGroup>,
  ) {
    if (!crop.succession_every_days || !cycle) return;
    // One pending row at a time: frequent harvests must not pile them up.
    const pending = await tx.task.findMany({
      where: {
        plant_id: plant.id,
        source: TaskSource.CROP_PLAN,
        status: TaskStatus.PENDING,
      },
    });
    if (pending.some((t) => metaOf(t.metadata)?.step === 'row')) return;
    const due = addDays(at, crop.succession_every_days);
    if (!windowContaining(crop, await group(), due)) return;
    const draft = this.draft(
      catalogue,
      crop,
      plant,
      cycle,
      `row:${isoDay(due)}`,
      { key: 'succession' },
      due,
    );
    draft.metadata = {
      crop_id: crop.id,
      step: 'row',
      title: { key: 'succession', crop: crop.id },
    };
    await this.tasks.createTasks(userId, plant.id, [draft], tx);
  }

  /** One crop reminder; its title is saved in English and its sentence in metadata, for other languages. */
  private draft(
    catalogue: Catalogue,
    crop: CropInfo,
    plant: Plant,
    cycle: PlantCycle | null,
    step: string,
    sentence: Omit<CropTitleRef, 'crop'>,
    dueDate: Date,
    type: TaskType = TaskType.OBSERVE,
    category: TaskCategory = TaskCategory.OBSERVATION,
  ): TaskDraft {
    const title: CropTitleRef = { ...sentence, crop: crop.id };
    return {
      type,
      category,
      priority: TaskPriority.MEDIUM,
      title: cropTitle(title, catalogue, 'en') ?? step,
      source: TaskSource.CROP_PLAN,
      sourceKey: `crop:${plant.id}:s${cycle?.id ?? 'none'}:${step}`,
      reason: `Part of growing ${titleName(crop)}.`,
      metadata: { crop_id: crop.id, step, title: { ...title } },
      dueDate,
      plantCycleId: cycle?.id ?? null,
    };
  }
}
