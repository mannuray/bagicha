import { Injectable } from '@nestjs/common';
import { Plant, PlantCycle, Prisma } from '@prisma/client';
import { InvariantError } from '../../../common/errors';
import {
  Page,
  PageQuery,
  toPage,
  toSkipTake,
} from '../../../common/pagination';
import { Tx } from '../../../common/prisma/transaction';
import { buildCycleSnapshot } from '../domain/cycle-summary';
import { resolveCycleYear } from '../domain/cycle-year';
import {
  CycleRepository,
  CycleWithRecentEntries,
} from '../repositories/cycle.repository';
import { JournalRepository } from '../repositories/journal.repository';
import { SpeciesNormalizationService } from './species-normalization.service';

function toCycleView(cycle: CycleWithRecentEntries) {
  return {
    id: cycle.id,
    cycle_year: cycle.cycle_year,
    season_no: cycle.season_no,
    started_at: cycle.started_at,
    closed_at: cycle.closed_at,
    place_id: cycle.place_id,
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
  };
}

export type CycleView = ReturnType<typeof toCycleView>;

/** Fruiting cycles: which cycle an event belongs to, and each cycle's summary. */
@Injectable()
export class CycleService {
  constructor(
    private readonly cycles: CycleRepository,
    private readonly journal: JournalRepository,
    private readonly species: SpeciesNormalizationService,
  ) {}

  /** The plant's cycle for `eventAt`, created if missing. The caller has already checked ownership. */
  async ensureCycle(
    userId: string,
    plant: Plant,
    eventAt: Date,
    tx?: Tx,
  ): Promise<PlantCycle> {
    const family = this.species.resolveSpeciesFamily(plant);
    const cycle = await this.cycles.upsertForYear(
      userId,
      plant.id,
      resolveCycleYear(family, eventAt),
      tx,
    );
    if (!cycle) {
      throw new InvariantError(
        'Cycle upsert ran for a plant the user does not own',
        {
          plantId: plant.id,
        },
      );
    }
    return cycle;
  }

  async refreshSummary(
    userId: string,
    plantId: string,
    cycleId: string,
    tx?: Tx,
  ): Promise<void> {
    const entries = await this.journal.listForCycle(
      userId,
      plantId,
      cycleId,
      tx,
    );
    const snapshot = buildCycleSnapshot(entries);
    await this.cycles.update(
      userId,
      cycleId,
      {
        ...snapshot,
        recommended_next_cycle_actions:
          snapshot.recommended_next_cycle_actions as Prisma.InputJsonValue,
      },
      tx,
    );
  }

  async list(
    userId: string,
    plantId: string,
    q: PageQuery,
  ): Promise<Page<CycleView>> {
    const { rows, total } = await this.cycles.listForPlant(
      userId,
      plantId,
      toSkipTake(q),
    );
    return toPage(rows.map(toCycleView), total, q);
  }
}
