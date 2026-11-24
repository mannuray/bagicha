import { Prisma } from '@prisma/client';
import { addDays } from '../../../common/time';
import type { Lang } from '../../../common/http/lang';
import type { AdviceRef, Catalogue } from '../../catalogue';

export interface TaskTemplateInput {
  key: string;
  title: string;
  category: string;
  priority: string;
  due_in_days: number;
  reason?: string;
  /** The title and reason as advice keys, so a saved task reads in the gardener's language. */
  advice?: { title: AdviceRef; reason?: AdviceRef; summary?: AdviceRef };
}

/** The dryness adjustment's advice; its sentences live in the catalogue. */
const DRYNESS = {
  priority: [
    { key: 'overlay.dryness.water_today' },
    { key: 'overlay.dryness.recheck_leaves' },
  ],
  suppressed: [{ key: 'overlay.dryness.no_deferring' }],
  summary: { key: 'overlay.dryness.summary' },
} satisfies Record<string, AdviceRef | AdviceRef[]>;

/** A saved dryness overlay's advice in the gardener's language (English as saved). */
export function overlayInLanguage<
  T extends {
    adjusted_phase: string | null;
    priority_actions: Prisma.JsonValue | string[];
    reasoning_summary: string | null;
  },
>(overlay: T, catalogue: Pick<Catalogue, 'advice'>, lang: Lang): T {
  if (lang === 'en' || !overlay.adjusted_phase?.endsWith('dryness_attention'))
    return overlay;
  return {
    ...overlay,
    priority_actions: DRYNESS.priority.map((r) => catalogue.advice(r, lang)),
    reasoning_summary: catalogue.advice(DRYNESS.summary, lang),
  };
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
  /** English text for an advice key (the overlay is saved in English). */
  en: (ref: AdviceRef) => string,
) {
  if (!entries.some(logSuggestsDryness)) return null;
  const waterReason = {
    key: 'overlay.task.water_today.reason',
    params: { name: plant.name },
  };
  const recheckReason = { key: 'overlay.task.recheck.reason' };
  return {
    adjusted_phase: phase
      ? `${phase}_with_dryness_attention`
      : 'dryness_attention',
    priority_actions: DRYNESS.priority.map(en),
    suppressed_actions: DRYNESS.suppressed.map(en),
    personalized_tasks: [
      {
        key: 'water_tree_today',
        title: en({ key: 'overlay.task.water_today.title' }),
        category: 'watering',
        priority: 'high',
        due_in_days: 0,
        reason: en(waterReason),
        advice: {
          title: { key: 'overlay.task.water_today.title' },
          reason: waterReason,
          summary: DRYNESS.summary,
        },
      },
      {
        key: 'recheck_dryness_response',
        title: en({ key: 'overlay.task.recheck.title' }),
        category: 'inspection',
        priority: 'medium',
        due_in_days: 2,
        reason: en(recheckReason),
        advice: {
          title: { key: 'overlay.task.recheck.title' },
          reason: recheckReason,
          summary: DRYNESS.summary,
        },
      },
    ] satisfies TaskTemplateInput[],
    reasoning_summary: en(DRYNESS.summary),
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
      advice:
        record.advice && typeof record.advice === 'object'
          ? (record.advice as TaskTemplateInput['advice'])
          : undefined,
    });
    return acc;
  }, []);
}
