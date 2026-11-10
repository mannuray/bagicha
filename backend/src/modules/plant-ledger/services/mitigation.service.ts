import { Injectable } from '@nestjs/common';
import { LogType } from '@prisma/client';
import {
  MitigationPlan,
  MitigationPlanner,
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
  ) {}

  /** Caller has already checked the user owns the plant. */
  async plan(userId: string, plantId: string): Promise<MitigationPlan> {
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
    return this.planner.plan({
      latest,
      previous,
      recentHealthLogs,
      latestCycleTasks,
      latestCycleLogs,
    });
  }
}
