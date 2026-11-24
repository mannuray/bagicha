import { Injectable } from '@nestjs/common';
import { PlantAccess } from './plant-access.service';
import { LogType } from '@prisma/client';
import type { Lang } from '../../../common/http/lang';
import { CatalogueStore } from '../../catalogue';
import {
  MitigationPlanner,
  renderPlan,
  type RenderedMitigationPlan,
} from '../domain/mitigation-planner';
import { CycleRepository } from '../repositories/cycle.repository';
import { JournalRepository } from '../repositories/journal.repository';
import { TaskRepository } from '../repositories/task.repository';

const HEALTH_LOG_TYPES = [
  LogType.DIAGNOSIS,
  LogType.PEST_DIAGNOSIS,
  LogType.TREATMENT,
  LogType.WATERING_STRESS,
];

/** "Learn for next season": loads cycle history and asks the planner what to change. */
@Injectable()
export class MitigationService {
  private readonly planner = new MitigationPlanner();

  constructor(
    private readonly cycles: CycleRepository,
    private readonly journal: JournalRepository,
    private readonly tasks: TaskRepository,
    private readonly access: PlantAccess,
    private readonly catalogue: CatalogueStore,
  ) {}

  async plan(
    userId: string,
    plantId: string,
    lang: Lang = 'en',
  ): Promise<RenderedMitigationPlan> {
    await this.access.owned(userId, plantId);
    const [latest = null, previous = null] = await this.cycles.latestTwo(
      userId,
      plantId,
    );
    const [recentHealthLogs, latestCycleLogs, latestCycleTasks] =
      await Promise.all([
        this.journal.recentByTypes(userId, plantId, HEALTH_LOG_TYPES, 6),
        latest
          ? this.journal.recentForCycle(userId, plantId, latest.id, 12)
          : [],
        latest ? this.tasks.listForCycle(userId, plantId, latest.id) : [],
      ]);
    const plan = this.planner.plan({
      latest,
      previous,
      recentHealthLogs,
      latestCycleTasks,
      latestCycleLogs,
    });
    return renderPlan(plan, await this.catalogue.snapshot(), lang);
  }
}
