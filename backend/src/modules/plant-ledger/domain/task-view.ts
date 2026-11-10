import {
  Prisma,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskType,
} from '@prisma/client';

export function defaultTaskTitle(type: string): string {
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

export function buildTaskSourceSummary(task: {
  source: string;
  metadata?: Prisma.JsonValue | null;
  seasonal_pack?: {
    current_phase: string | null;
    upcoming_phase: string | null;
  } | null;
  personalized_overlay?: {
    reasoning_summary: string | null;
    adjusted_phase: string | null;
  } | null;
}): string | null {
  if (task.source === 'MANUAL') {
    const metadata = task.metadata as
      | Record<string, unknown>
      | null
      | undefined;
    const originType =
      typeof metadata?.origin_log_type === 'string'
        ? metadata.origin_log_type
        : null;
    const originContent =
      typeof metadata?.origin_log_content === 'string'
        ? metadata.origin_log_content
        : null;
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
    const upcomingPhase = task.seasonal_pack?.upcoming_phase?.replace(
      /_/g,
      ' ',
    );
    if (currentPhase && upcomingPhase) {
      return `Seasonal guidance for ${currentPhase}, with ${upcomingPhase} coming next.`;
    }
    return 'Seasonal guidance for the current plant phase.';
  }

  return null;
}

export function mapTaskView(task: {
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
  seasonal_pack?: {
    current_phase: string | null;
    upcoming_phase: string | null;
  } | null;
  personalized_overlay?: {
    reasoning_summary: string | null;
    adjusted_phase: string | null;
  } | null;
}) {
  return {
    id: task.id,
    type: task.type,
    title: task.title ?? defaultTaskTitle(task.type),
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
    source_summary: buildTaskSourceSummary(task),
  };
}
