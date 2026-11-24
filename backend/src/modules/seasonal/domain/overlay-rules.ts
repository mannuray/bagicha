import { Prisma } from '@prisma/client';
import { addDays } from '../../../common/time';

export interface TaskTemplateInput {
  key: string;
  title: string;
  category: string;
  priority: string;
  due_in_days: number;
  reason?: string;
}

type EntrySignal = {
  content: string | null;
  metadata: Prisma.JsonValue | null;
  timestamp?: Date;
};

const DRYNESS_TERMS = [
  'dry',
  'dryness',
  'water stress',
  'wilting',
  'thirsty',
  'soil dry',
];

function logSuggestsDryness(entry: EntrySignal): boolean {
  const haystack =
    `${entry.content || ''} ${entry.metadata ? JSON.stringify(entry.metadata) : ''}`.toLowerCase();
  return DRYNESS_TERMS.some((term) => haystack.includes(term));
}

/** Premium-only adjustments to the cohort pack based on what this plant's journal says. */
export function buildPersonalizedOverlay(
  plant: { name: string },
  entries: EntrySignal[],
  /** The reviewed-care phase, or null for a tree whose care hasn't shipped. */
  phase: string | null,
  now: Date,
) {
  if (!entries.some(logSuggestsDryness)) return null;
  return {
    adjusted_phase: phase
      ? `${phase}_with_dryness_attention`
      : 'dryness_attention',
    priority_actions: [
      'Water the plant today',
      'Recheck leaf stress after watering',
    ],
    suppressed_actions: [
      'Do not defer irrigation until the next normal checkpoint',
    ],
    personalized_tasks: [
      {
        key: 'water_tree_today',
        title: 'Water the plant today',
        category: 'watering',
        priority: 'high',
        due_in_days: 0,
        reason: `Dryness signal detected for ${plant.name}`,
      },
      {
        key: 'recheck_dryness_response',
        title: 'Recheck the plant after watering',
        category: 'inspection',
        priority: 'medium',
        due_in_days: 2,
        reason: 'Confirm recovery after dryness intervention',
      },
    ] satisfies TaskTemplateInput[],
    reasoning_summary:
      'Recent journal_entries indicate dryness or water stress, so irrigation support is needed immediately.',
    expires_at: addDays(now, 2),
    refreshed_at: now,
  };
}

/** Reads templates back from stored JSON, dropping malformed items. */
export function asTaskTemplates(
  value: Prisma.JsonValue | null,
): TaskTemplateInput[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<TaskTemplateInput[]>((acc, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return acc;
    const record = item as Record<string, unknown>;
    if (typeof record.key !== 'string' || typeof record.title !== 'string')
      return acc;
    acc.push({
      key: record.key,
      title: record.title,
      category:
        typeof record.category === 'string' ? record.category : 'inspection',
      priority:
        typeof record.priority === 'string' ? record.priority : 'medium',
      due_in_days:
        typeof record.due_in_days === 'number' ? record.due_in_days : 0,
      reason: typeof record.reason === 'string' ? record.reason : undefined,
    });
    return acc;
  }, []);
}
