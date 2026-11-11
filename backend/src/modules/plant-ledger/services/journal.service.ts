import { Injectable } from '@nestjs/common';
import {
  JournalEntry,
  LogType,
  Plant,
  Prisma,
  TaskSource,
} from '@prisma/client';
import { InvariantError, NotFoundError } from '../../../common/errors';
import {
  Page,
  PageQuery,
  toPage,
  toSkipTake,
} from '../../../common/pagination';
import { Tx, TransactionRunner } from '../../../common/prisma/transaction';
import { addDays, Clock } from '../../../common/time';
import { followUpTemplateFor } from '../domain/follow-up-templates';
import { JournalRepository } from '../repositories/journal.repository';
import { PlantRepository } from '../repositories/plant.repository';
import { CycleService } from './cycle.service';
import { CropJourneyService } from './crop-journey.service';
import { TaskService } from './task.service';
import { LifecycleService } from './lifecycle.service';

export interface NewJournalEntry {
  type: LogType;
  content?: string | null;
  metadata?: Prisma.InputJsonValue;
  eventAt?: Date;
}

/** An entry another workflow (e.g. diagnosis) has already placed in a cycle. */
export interface RecordedJournalEntry {
  type: LogType;
  content?: string | null;
  metadata?: Prisma.InputJsonValue;
  eventAt: Date;
  recordedAt: Date;
  plantCycleId: string | null;
  diagnosisOutcomeId?: string | null;
}

/** Milestone dates a new entry fills in on the plant (first flowering, harvests…). */
function milestonesFor(
  plant: Plant,
  type: LogType,
  eventAt: Date,
  firstsAlreadyPast: boolean,
) {
  const data: Record<string, Date> = {};
  // An old tree's firsts happened before Bagicha; today's log is not one of them.
  const firsts = !firstsAlreadyPast;
  if (firsts && type === LogType.FLOWERING && !plant.first_flowering_at) {
    data.first_flowering_at = eventAt;
  }
  if (firsts && type === LogType.FRUIT_SET && !plant.first_fruit_set_at) {
    data.first_fruit_set_at = eventAt;
  }
  if (type === LogType.HARVEST) {
    if (firsts && !plant.first_harvest_at) data.first_harvest_at = eventAt;
    data.latest_harvest_at = eventAt;
  }
  return data;
}

/** "Log what happened": journal entries and everything an entry updates. */
@Injectable()
export class JournalService {
  constructor(
    private readonly journal: JournalRepository,
    private readonly plants: PlantRepository,
    private readonly cycles: CycleService,
    private readonly tasks: TaskService,
    private readonly cropJourney: CropJourneyService,
    private readonly transactions: TransactionRunner,
    private readonly clock: Clock,
    private readonly lifecycle: LifecycleService,
  ) {}

  /**
   * Records an entry in the right cycle, updates plant milestones and the cycle
   * summary, and creates the follow-up task the entry calls for — atomically.
   */
  addEntry(
    userId: string,
    plantId: string,
    entry: NewJournalEntry,
    tx?: Tx,
  ): Promise<JournalEntry> {
    return tx
      ? this.addEntryIn(tx, userId, plantId, entry)
      : this.transactions.run((t) =>
          this.addEntryIn(t, userId, plantId, entry),
        );
  }

  private async addEntryIn(
    tx: Tx,
    userId: string,
    plantId: string,
    entry: NewJournalEntry,
  ): Promise<JournalEntry> {
    const plant = await this.plants.findOwned(userId, plantId, tx);
    if (!plant) throw new NotFoundError('PLANT_NOT_FOUND', 'Plant not found');

    const eventAt = entry.eventAt ?? this.clock.now();
    // Journey crops have seasons opened by planting; everything else keeps yearly cycles.
    const season = plant.crop_id
      ? await this.cropJourney.seasonFor(
          tx,
          userId,
          plant,
          entry.type,
          entry.metadata,
          eventAt,
        )
      : {
          cycle: await this.cycles.ensureCycle(userId, plant, eventAt, tx),
          opened: false,
        };
    const cycle = season.cycle;
    const log = await this.journal.create(
      userId,
      plant.id,
      {
        type: entry.type,
        content: entry.content,
        metadata: entry.metadata,
        plant_cycle_id: cycle?.id ?? null,
        timestamp: eventAt,
      },
      tx,
    );
    if (!log) throw new InvariantError('Journal write lost plant ownership');

    const milestones = milestonesFor(
      plant,
      log.type,
      log.timestamp,
      this.lifecycle.predatesFirsts(plant),
    );
    if (Object.keys(milestones).length > 0) {
      await this.plants.updateOwned(userId, plant.id, milestones, tx);
    }
    if (cycle) await this.cycles.refreshSummary(userId, plant.id, cycle.id, tx);
    if (plant.crop_id)
      await this.cropJourney.afterEntry(
        tx,
        userId,
        plant,
        log,
        cycle,
        season.opened,
      );

    const followUp = followUpTemplateFor(plant.name, log.type);
    if (followUp) {
      await this.tasks.createTasks(
        userId,
        plant.id,
        [
          {
            type: followUp.type,
            category: followUp.category,
            priority: followUp.priority,
            title: followUp.title,
            source: TaskSource.MANUAL,
            sourceKey: `log:${log.id}:${followUp.type}`,
            reason: followUp.reason,
            metadata: {
              origin_log_id: log.id,
              origin_log_type: log.type,
              origin_log_content: log.content,
            },
            dueDate: addDays(log.timestamp, followUp.dueInDays),
            plantCycleId: cycle?.id ?? null,
          },
        ],
        tx,
      );
    }
    return log;
  }

  /**
   * Writes an entry exactly as given — no milestones, summary refresh or
   * follow-up task. For workflows that manage those themselves (diagnosis).
   */
  async recordEntry(
    userId: string,
    plantId: string,
    entry: RecordedJournalEntry,
    tx?: Tx,
  ): Promise<JournalEntry> {
    const log = await this.journal.create(
      userId,
      plantId,
      {
        type: entry.type,
        content: entry.content,
        metadata: entry.metadata,
        timestamp: entry.eventAt,
        recorded_at: entry.recordedAt,
        plant_cycle_id: entry.plantCycleId,
        diagnosis_outcome_id: entry.diagnosisOutcomeId ?? null,
      },
      tx,
    );
    if (!log) throw new NotFoundError('PLANT_NOT_FOUND', 'Plant not found');
    return log;
  }

  /** Most recent entries for an owned plant (newest first); empty for anyone else. */
  recent(
    userId: string,
    plantId: string,
    take: number,
  ): Promise<JournalEntry[]> {
    return this.journal.recent(userId, plantId, take);
  }

  async timeline(
    userId: string,
    plantId: string,
    q: PageQuery & { types?: LogType[] },
  ): Promise<Page<JournalEntry>> {
    const { rows, total } = await this.journal.listForPlant(
      userId,
      plantId,
      toSkipTake(q),
      q.types,
    );
    return toPage(rows, total, q);
  }
}
