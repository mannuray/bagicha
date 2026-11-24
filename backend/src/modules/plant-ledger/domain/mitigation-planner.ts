import { DropLevel, LogType, Prisma, TaskStatus } from '@prisma/client';
import type { AdviceRef, Catalogue } from '../../catalogue';
import type { Lang } from '../../../common/http/lang';

/** A drop level as advice, so its word ("high") is translated too. */
const dropLevel = (level: DropLevel): AdviceRef => ({
  key: `drop.level.${level.toLowerCase()}`,
});

/** The same advice once, first occurrence first (it was a Set of sentences). */
function distinct(refs: AdviceRef[]): AdviceRef[] {
  const seen = new Set<string>();
  return refs.filter((r) => {
    const id = JSON.stringify(r);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

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
): AdviceRef[] {
  const issues: AdviceRef[] = [];
  if (!latest) return issues;

  if (latest.observed_flowering_at && !latest.observed_fruit_set_at) {
    issues.push({ key: 'mitigation.issue.no_fruit_set' });
  }

  if (
    latest.flower_drop_level === DropLevel.HIGH ||
    latest.flower_drop_level === DropLevel.MEDIUM
  ) {
    issues.push({
      key: 'mitigation.issue.flower_drop',
      params: { level: dropLevel(latest.flower_drop_level) },
    });
  }

  if (
    latest.fruit_drop_level === DropLevel.HIGH ||
    latest.fruit_drop_level === DropLevel.MEDIUM
  ) {
    issues.push({
      key: 'mitigation.issue.fruit_drop',
      params: { level: dropLevel(latest.fruit_drop_level) },
    });
  }

  if ((latest.stress_score ?? 0) > 0) {
    issues.push({
      key: 'mitigation.issue.stress_signals',
      params: { count: latest.stress_score ?? 0 },
    });
  }

  if ((latest.pest_pressure_score ?? 0) > 0) {
    issues.push({
      key: 'mitigation.issue.pest_signals',
      params: { count: latest.pest_pressure_score ?? 0 },
    });
  }

  if (previous && (latest.stress_score ?? 0) > (previous.stress_score ?? 0)) {
    issues.push({ key: 'mitigation.issue.stress_increased' });
  }

  if (
    previous &&
    (latest.pest_pressure_score ?? 0) > (previous.pest_pressure_score ?? 0)
  ) {
    issues.push({ key: 'mitigation.issue.pests_increased' });
  }

  if (
    journal_entries.some(
      (log) =>
        log.type === LogType.DIAGNOSIS || log.type === LogType.PEST_DIAGNOSIS,
    )
  ) {
    issues.push({ key: 'mitigation.issue.recent_diagnosis' });
  }

  const harvestLossCategory = extractHarvestLossCategory(cycleLogs);
  if (harvestLossCategory) {
    issues.push({
      key: 'mitigation.issue.harvest_loss',
      params: { cause: harvestLossCategory.replace(/_/g, ' ').toLowerCase() },
    });
  }

  const skippedTasks = tasks.filter(
    (task) => task.status === TaskStatus.SKIPPED,
  ).length;
  if (skippedTasks > 0) {
    issues.push({
      key: 'mitigation.issue.skipped_tasks',
      params: { count: skippedTasks },
    });
  }

  return distinct(issues).slice(0, 4);
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
): AdviceRef[] {
  const actions: AdviceRef[] = [];
  if (!latest) return actions;

  if (latest.observed_flowering_at && !latest.observed_fruit_set_at) {
    actions.push({ key: 'mitigation.change.confirm_fruit_set' });
  }
  if ((latest.stress_score ?? 0) > 0) {
    actions.push({ key: 'mitigation.change.stabilize_watering' });
  }
  if ((latest.pest_pressure_score ?? 0) > 0) {
    actions.push({ key: 'mitigation.change.scout_pests' });
  }
  if (
    latest.flower_drop_level === DropLevel.HIGH ||
    latest.flower_drop_level === DropLevel.MEDIUM
  ) {
    actions.push({ key: 'mitigation.change.track_flower_drop' });
  }
  if (
    latest.fruit_drop_level === DropLevel.HIGH ||
    latest.fruit_drop_level === DropLevel.MEDIUM
  ) {
    actions.push({ key: 'mitigation.change.inspect_fruit_retention' });
  }
  if (
    previous?.harvest_completed_at != null &&
    latest.observed_fruit_set_at == null
  ) {
    actions.push({ key: 'mitigation.change.benchmark_last_cycle' });
  }
  if (journal_entries.some((log) => log.type === LogType.TREATMENT)) {
    actions.push({ key: 'mitigation.change.recheck_treatments' });
  }
  if (tasks.some((task) => task.status === TaskStatus.SKIPPED)) {
    actions.push({ key: 'mitigation.change.no_skipping' });
  }
  const harvestLossCategory = extractHarvestLossCategory(cycleLogs);
  if (harvestLossCategory === 'CRACKING') {
    actions.push({ key: 'mitigation.change.cracking' });
  } else if (harvestLossCategory === 'PEST_DAMAGE') {
    actions.push({ key: 'mitigation.change.pest_damage' });
  } else if (harvestLossCategory === 'ROT') {
    actions.push({ key: 'mitigation.change.rot' });
  }

  return distinct(actions).slice(0, 4);
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
): AdviceRef[] {
  const watch: AdviceRef[] = [];
  if (!latest) return watch;

  if ((latest.stress_score ?? 0) > 0) {
    watch.push({ key: 'mitigation.watch.wilt' });
  }
  if ((latest.pest_pressure_score ?? 0) > 0) {
    watch.push({ key: 'mitigation.watch.pests' });
  }
  if (
    latest.flower_drop_level === DropLevel.HIGH ||
    latest.flower_drop_level === DropLevel.MEDIUM
  ) {
    watch.push({ key: 'mitigation.watch.flower_drop' });
  }
  if (
    latest.fruit_drop_level === DropLevel.HIGH ||
    latest.fruit_drop_level === DropLevel.MEDIUM
  ) {
    watch.push({ key: 'mitigation.watch.fruit_drop' });
  }
  if (journal_entries.some((log) => log.type === LogType.DIAGNOSIS)) {
    watch.push({ key: 'mitigation.watch.repeat_diagnosis' });
  }
  const harvestLossCategory = extractHarvestLossCategory(cycleLogs);
  if (harvestLossCategory === 'BIRD_DAMAGE') {
    watch.push({ key: 'mitigation.watch.birds' });
  } else if (harvestLossCategory === 'WEATHER_DAMAGE') {
    watch.push({ key: 'mitigation.watch.weather' });
  }

  return distinct(watch).slice(0, 4);
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
): AdviceRef[] {
  const actions: AdviceRef[] = [];
  if (!latest) return actions;

  actions.push({ key: 'mitigation.priority.review_cycle' });
  if ((latest.stress_score ?? 0) > 0) {
    actions.push({ key: 'mitigation.priority.moisture_tasks' });
  }
  if (
    (latest.pest_pressure_score ?? 0) > 0 ||
    journal_entries.some((log) => log.type === LogType.PEST_DIAGNOSIS)
  ) {
    actions.push({ key: 'mitigation.priority.pest_inspection' });
  }
  if (latest.observed_flowering_at && !latest.observed_fruit_set_at) {
    actions.push({ key: 'mitigation.priority.log_conversion' });
  }
  if (previous?.harvest_completed_at != null) {
    actions.push({ key: 'mitigation.priority.compare_harvest' });
  }
  if (tasks.some((task) => task.status === TaskStatus.PENDING)) {
    actions.push({ key: 'mitigation.priority.close_pending' });
  }
  if (extractHarvestLossCategory(cycleLogs)) {
    actions.push({ key: 'mitigation.priority.log_loss_causes' });
  }

  return distinct(actions).slice(0, 4);
}

function buildMitigationSummary(
  latest: { cycle_year: number } | null,
  previous: { cycle_year: number } | null,
  issues: AdviceRef[],
): AdviceRef {
  if (!latest) {
    return { key: 'mitigation.summary.no_history' };
  }

  if (issues.length === 0) {
    return previous
      ? {
          key: 'mitigation.summary.no_pattern_vs_previous',
          params: { year: latest.cycle_year, previous: previous.cycle_year },
        }
      : {
          key: 'mitigation.summary.no_pattern_yet',
          params: { year: latest.cycle_year },
        };
  }

  return previous
    ? {
        key: 'mitigation.summary.improve_vs_previous',
        params: { year: latest.cycle_year, previous: previous.cycle_year },
      }
    : {
        key: 'mitigation.summary.enough_signals',
        params: { year: latest.cycle_year },
      };
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

/** The plan as advice keys; MitigationService renders it in the gardener's language. */
export interface MitigationPlan {
  cycle_year: number | null;
  summary: AdviceRef;
  likely_issues: AdviceRef[];
  what_to_change: AdviceRef[];
  watch_early: AdviceRef[];
  priority_actions: AdviceRef[];
  completed_tasks: number;
  skipped_tasks: number;
  pending_tasks: number;
}

/** "What went wrong this cycle and what to change next time" from cycle history. */
/** The plan as the gardener reads it. */
export interface RenderedMitigationPlan {
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

/** The plan's advice in the gardener's language. */
export function renderPlan(
  plan: MitigationPlan,
  catalogue: Pick<Catalogue, 'advice'>,
  lang: Lang,
): RenderedMitigationPlan {
  const text = (ref: AdviceRef) => catalogue.advice(ref, lang);
  return {
    ...plan,
    summary: text(plan.summary),
    likely_issues: plan.likely_issues.map(text),
    what_to_change: plan.what_to_change.map(text),
    watch_early: plan.watch_early.map(text),
    priority_actions: plan.priority_actions.map(text),
  };
}

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
