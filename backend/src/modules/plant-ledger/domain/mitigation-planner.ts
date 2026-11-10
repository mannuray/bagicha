import { DropLevel, LogType, Prisma, TaskStatus } from '@prisma/client';

function rankLikelyIssues(
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

  if (
    latest.flower_drop_level === DropLevel.HIGH ||
    latest.flower_drop_level === DropLevel.MEDIUM
  ) {
    issues.push(
      `Flower drop was ${latest.flower_drop_level.toLowerCase()} and likely reduced conversion to fruit set.`,
    );
  }

  if (
    latest.fruit_drop_level === DropLevel.HIGH ||
    latest.fruit_drop_level === DropLevel.MEDIUM
  ) {
    issues.push(
      `Fruit drop was ${latest.fruit_drop_level.toLowerCase()} and likely weakened harvest outcome.`,
    );
  }

  if ((latest.stress_score ?? 0) > 0) {
    issues.push(
      `Water or weather stress signals were recorded ${latest.stress_score} time(s) this cycle.`,
    );
  }

  if ((latest.pest_pressure_score ?? 0) > 0) {
    issues.push(
      `Pest pressure was recorded ${latest.pest_pressure_score} time(s) this cycle.`,
    );
  }

  if (previous && (latest.stress_score ?? 0) > (previous.stress_score ?? 0)) {
    issues.push('Stress pressure increased compared with the previous cycle.');
  }

  if (
    previous &&
    (latest.pest_pressure_score ?? 0) > (previous.pest_pressure_score ?? 0)
  ) {
    issues.push('Pest pressure increased compared with the previous cycle.');
  }

  if (
    journal_entries.some(
      (log) =>
        log.type === LogType.DIAGNOSIS || log.type === LogType.PEST_DIAGNOSIS,
    )
  ) {
    issues.push(
      'Recent diagnosis activity suggests unresolved health stress may still be affecting recovery.',
    );
  }

  const harvestLossCategory = extractHarvestLossCategory(cycleLogs);
  if (harvestLossCategory) {
    issues.push(
      `Harvest loss was linked to ${harvestLossCategory.replace(/_/g, ' ').toLowerCase()}.`,
    );
  }

  const skippedTasks = tasks.filter(
    (task) => task.status === TaskStatus.SKIPPED,
  ).length;
  if (skippedTasks > 0) {
    issues.push(
      `${skippedTasks} cycle task(s) were skipped, which may have reduced early intervention.`,
    );
  }

  return Array.from(new Set(issues)).slice(0, 4);
}

function buildWhatToChange(
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
    actions.push(
      'Confirm fruit set early next cycle instead of waiting until harvest time to assess outcome.',
    );
  }
  if ((latest.stress_score ?? 0) > 0) {
    actions.push(
      'Stabilize watering and moisture checks before flowering and during early fruit development.',
    );
  }
  if ((latest.pest_pressure_score ?? 0) > 0) {
    actions.push(
      'Start pest scouting earlier and follow diagnosis journal_entries with a same-cycle treatment or inspection.',
    );
  }
  if (
    latest.flower_drop_level === DropLevel.HIGH ||
    latest.flower_drop_level === DropLevel.MEDIUM
  ) {
    actions.push(
      'Track flower drop as soon as bloom starts so intervention is not delayed.',
    );
  }
  if (
    latest.fruit_drop_level === DropLevel.HIGH ||
    latest.fruit_drop_level === DropLevel.MEDIUM
  ) {
    actions.push(
      'Inspect fruit retention earlier and log drop severity before the harvest window is affected.',
    );
  }
  if (
    previous?.harvest_completed_at != null &&
    latest.observed_fruit_set_at == null
  ) {
    actions.push(
      'Use last cycle as a benchmark and review what changed before flowering this year.',
    );
  }
  if (journal_entries.some((log) => log.type === LogType.TREATMENT)) {
    actions.push(
      'Recheck treatment outcomes consistently so the next cycle starts from a cleaner health baseline.',
    );
  }
  if (tasks.some((task) => task.status === TaskStatus.SKIPPED)) {
    actions.push(
      'Avoid skipping early-cycle tasks next time, especially inspection and treatment follow-ups.',
    );
  }
  const harvestLossCategory = extractHarvestLossCategory(cycleLogs);
  if (harvestLossCategory === 'CRACKING') {
    actions.push(
      'Prepare rain and irrigation stability around harvest to reduce cracking losses.',
    );
  } else if (harvestLossCategory === 'PEST_DAMAGE') {
    actions.push(
      'Protect the harvest earlier with pest checks before fruit quality starts dropping.',
    );
  } else if (harvestLossCategory === 'ROT') {
    actions.push(
      'Reduce post-rain disease pressure and inspect fruit quality earlier in the harvest window.',
    );
  }

  return Array.from(new Set(actions)).slice(0, 4);
}

function buildWatchEarly(
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
    watch.push(
      'Early leaf wilt, dry soil, and repeated watering stress signals.',
    );
  }
  if ((latest.pest_pressure_score ?? 0) > 0) {
    watch.push('Recurring pest symptoms before flowering and fruit set.');
  }
  if (
    latest.flower_drop_level === DropLevel.HIGH ||
    latest.flower_drop_level === DropLevel.MEDIUM
  ) {
    watch.push('Flower drop in the first bloom window.');
  }
  if (
    latest.fruit_drop_level === DropLevel.HIGH ||
    latest.fruit_drop_level === DropLevel.MEDIUM
  ) {
    watch.push('Fruit drop shortly after set.');
  }
  if (journal_entries.some((log) => log.type === LogType.DIAGNOSIS)) {
    watch.push(
      'Any repeat of the last diagnosis symptoms before the cycle stabilizes.',
    );
  }
  const harvestLossCategory = extractHarvestLossCategory(cycleLogs);
  if (harvestLossCategory === 'BIRD_DAMAGE') {
    watch.push('Early bird damage signs close to harvest maturity.');
  } else if (harvestLossCategory === 'WEATHER_DAMAGE') {
    watch.push('Rain, wind, or heat events close to fruit maturity.');
  }

  return Array.from(new Set(watch)).slice(0, 4);
}

function buildPriorityActions(
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
    actions.push(
      'Set one moisture-check task before bloom and one during early fruit development.',
    );
  }
  if (
    (latest.pest_pressure_score ?? 0) > 0 ||
    journal_entries.some((log) => log.type === LogType.PEST_DIAGNOSIS)
  ) {
    actions.push(
      'Schedule an early pest inspection instead of waiting for visible damage.',
    );
  }
  if (latest.observed_flowering_at && !latest.observed_fruit_set_at) {
    actions.push(
      'Log flower-to-fruit conversion explicitly next cycle to catch weak set earlier.',
    );
  }
  if (previous?.harvest_completed_at != null) {
    actions.push(
      'Compare the next cycle against the last successful harvest, not just current symptoms.',
    );
  }
  if (tasks.some((task) => task.status === TaskStatus.PENDING)) {
    actions.push(
      'Close or review pending cycle tasks before the next flowering window opens.',
    );
  }
  if (extractHarvestLossCategory(cycleLogs)) {
    actions.push(
      'Log harvest loss causes with more detail next cycle so mitigation stays specific.',
    );
  }

  return Array.from(new Set(actions)).slice(0, 4);
}

function buildMitigationSummary(
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

function extractHarvestLossCategory(
  journal_entries: Array<{
    type: LogType;
    metadata: Prisma.JsonValue | null;
  }>,
): string | null {
  const harvestMetadata = journal_entries
    .filter((log) => log.type === LogType.HARVEST)
    .map((log) => log.metadata as Record<string, unknown> | null | undefined)
    .find((metadata) => typeof metadata?.loss_category === 'string');

  return typeof harvestMetadata?.loss_category === 'string'
    ? harvestMetadata.loss_category
    : null;
}

type CycleInput = Parameters<typeof rankLikelyIssues>[0] &
  Parameters<typeof buildWhatToChange>[0] & { cycle_year: number };
type PreviousInput = Parameters<typeof rankLikelyIssues>[1] &
  Parameters<typeof buildWhatToChange>[1] & { cycle_year: number };

export interface MitigationInput {
  latest: CycleInput | null;
  previous: PreviousInput | null;
  recentHealthLogs: Array<{ type: LogType; content: string | null }>;
  latestCycleTasks: Array<{ status: TaskStatus; title: string | null }>;
  latestCycleLogs: Array<{ type: LogType; metadata: Prisma.JsonValue | null }>;
}

export interface MitigationPlan {
  cycle_year: number | null;
  summary: string;
  likely_issues: string[];
  what_to_change: string[];
  watch_early: string[];
  priority_actions: string[];
  completed_tasks: number;
  skipped_tasks: number;
  pending_tasks: number;
}

/** "What went wrong this cycle and what to change next time" from cycle history. */
export class MitigationPlanner {
  plan(input: MitigationInput): MitigationPlan {
    const {
      latest,
      previous,
      recentHealthLogs,
      latestCycleTasks,
      latestCycleLogs,
    } = input;
    const likelyIssues = rankLikelyIssues(
      latest,
      previous,
      recentHealthLogs,
      latestCycleTasks,
      latestCycleLogs,
    );
    const countBy = (status: TaskStatus) =>
      latestCycleTasks.filter((task) => task.status === status).length;

    return {
      cycle_year: latest?.cycle_year ?? null,
      summary: buildMitigationSummary(latest, previous, likelyIssues),
      likely_issues: likelyIssues,
      what_to_change: buildWhatToChange(
        latest,
        previous,
        recentHealthLogs,
        latestCycleTasks,
        latestCycleLogs,
      ),
      watch_early: buildWatchEarly(latest, recentHealthLogs, latestCycleLogs),
      priority_actions: buildPriorityActions(
        latest,
        previous,
        recentHealthLogs,
        latestCycleTasks,
        latestCycleLogs,
      ),
      completed_tasks: countBy(TaskStatus.COMPLETED),
      skipped_tasks: countBy(TaskStatus.SKIPPED),
      pending_tasks: countBy(TaskStatus.PENDING),
    };
  }
}
