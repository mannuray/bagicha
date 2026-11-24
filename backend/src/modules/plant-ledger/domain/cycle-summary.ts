import { DropLevel, JournalEntry, LogType, YieldQuality } from '@prisma/client';
import type { AdviceRef, Catalogue } from '../../catalogue';
import type { Lang } from '../../../common/http/lang';

export function parseDropLevel(metadata: unknown, key: string): DropLevel {
  const value = (metadata as Record<string, unknown> | null | undefined)?.[key];
  if (typeof value !== 'string') return DropLevel.UNKNOWN;
  switch (value.toUpperCase()) {
    case 'LOW':
      return DropLevel.LOW;
    case 'MEDIUM':
      return DropLevel.MEDIUM;
    case 'HIGH':
      return DropLevel.HIGH;
    case 'NONE':
      return DropLevel.NONE;
    default:
      return DropLevel.UNKNOWN;
  }
}

export function maxDropLevel(levels: DropLevel[]): DropLevel {
  const rank: Record<DropLevel, number> = {
    [DropLevel.NONE]: 0,
    [DropLevel.LOW]: 1,
    [DropLevel.MEDIUM]: 2,
    [DropLevel.HIGH]: 3,
    [DropLevel.UNKNOWN]: -1,
  };

  return levels.reduce(
    (current, level) => (rank[level] > rank[current] ? level : current),
    DropLevel.UNKNOWN,
  );
}

export function parseQuantityValue(quantity: unknown): number | null {
  if (typeof quantity === 'number') return quantity;
  if (typeof quantity !== 'string') return null;
  const match = quantity.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function parseQuantityUnit(quantity: unknown): string | null {
  if (typeof quantity === 'string' && /^[A-Za-z ]+$/.test(quantity.trim())) {
    return quantity.trim();
  }
  if (typeof quantity !== 'string') return null;
  const match = quantity.match(/\d+(?:\.\d+)?\s*(.*)$/);
  const unit = match?.[1]?.trim();
  return unit ? unit : null;
}

export function parseYieldQuality(quality: unknown): YieldQuality {
  if (typeof quality !== 'string') return YieldQuality.UNKNOWN;
  switch (quality.toUpperCase()) {
    case 'POOR':
      return YieldQuality.POOR;
    case 'FAIR':
      return YieldQuality.FAIR;
    case 'GOOD':
      return YieldQuality.GOOD;
    case 'EXCELLENT':
      return YieldQuality.EXCELLENT;
    default:
      return YieldQuality.UNKNOWN;
  }
}

/** One season's summary as advice pieces (the English joins them with spaces). */
export function buildCycleSummary(input: {
  flowering: Date | null;
  fruitSet: Date | null;
  harvestCount: number;
  flowerDropLevel: DropLevel;
  fruitDropLevel: DropLevel;
  stressScore: number;
  pestPressureScore: number;
}): AdviceRef[] {
  const parts: AdviceRef[] = [];
  parts.push({
    key: input.flowering
      ? 'cycle.summary.flowering'
      : 'cycle.summary.no_flowering',
  });
  if (input.fruitSet) parts.push({ key: 'cycle.summary.fruit_set' });
  else if (input.flowering) parts.push({ key: 'cycle.summary.no_fruit_set' });
  if (input.harvestCount > 0)
    parts.push({
      key:
        input.harvestCount > 1
          ? 'cycle.summary.harvests_many'
          : 'cycle.summary.harvests_one',
      params: { count: input.harvestCount },
    });
  if (
    input.flowerDropLevel === DropLevel.HIGH ||
    input.fruitDropLevel === DropLevel.HIGH
  )
    parts.push({ key: 'cycle.summary.high_drop' });
  if (input.stressScore > 0 || input.pestPressureScore > 0)
    parts.push({
      key: 'cycle.summary.signals',
      params: { stress: input.stressScore, pests: input.pestPressureScore },
    });
  return parts;
}

/** The summary pieces as one sentence in the gardener's language. */
export function renderCycleSummary(
  parts: AdviceRef[],
  catalogue: Pick<Catalogue, 'advice' | 'adviceHasHindi'>,
  lang: Lang,
): string {
  // Hindi joins only a fully Hindi sentence; until then it reads as English.
  const hindi =
    lang === 'hi' && parts.every((p) => catalogue.adviceHasHindi(p.key));
  const words = parts.map((p) => catalogue.advice(p, hindi ? 'hi' : 'en'));
  return hindi ? `${words.join(', ')}।` : `${words.join(' ')}.`;
}

export function buildRecommendedActions(input: {
  flowering: Date | null;
  fruitSet: Date | null;
  harvestCount: number;
  flowerDropLevel: DropLevel;
  fruitDropLevel: DropLevel;
  stressScore: number;
  pestPressureScore: number;
  treatmentCount: number;
}): AdviceRef[] {
  const actions: AdviceRef[] = [];
  const add = (key: string) => actions.push({ key: `cycle.next.${key}` });
  if (input.flowering && !input.fruitSet) add('confirm_fruit_set');
  if (
    input.flowerDropLevel === DropLevel.MEDIUM ||
    input.flowerDropLevel === DropLevel.HIGH
  )
    add('track_flower_drop');
  if (
    input.fruitDropLevel === DropLevel.MEDIUM ||
    input.fruitDropLevel === DropLevel.HIGH
  )
    add('watch_fruit_retention');
  if (input.stressScore > 0) add('moisture_checks');
  if (input.pestPressureScore > 0 && input.treatmentCount === 0)
    add('treatment_plan');
  if (input.harvestCount === 0) add('keep_recording');
  return actions.slice(0, 4);
}

export type CycleEntry = Pick<JournalEntry, 'type' | 'metadata' | 'timestamp'>;

/**
 * The season's yield: every harvest that shares the latest harvest's unit,
 * summed. Harvests in another unit can't be added, so they are left out.
 */
function seasonYield(harvests: CycleEntry[]): {
  quantity: number | null;
  unit: string | null;
} {
  const amounts = harvests.map((log) => {
    const m = (log.metadata ?? {}) as Record<string, unknown>;
    return {
      value: parseQuantityValue(m.quantity_value ?? m.quantity),
      unit: parseQuantityUnit(m.quantity_unit ?? m.quantity),
    };
  });
  // The latest harvest that has an amount: a quality-only note must not hide the season.
  const unit = amounts.filter((a) => a.value !== null).at(-1)?.unit ?? null;
  const same = amounts.filter(
    (a) => a.value !== null && a.unit?.toLowerCase() === unit?.toLowerCase(),
  );
  if (same.length === 0) return { quantity: null, unit };
  return {
    quantity: same.reduce((sum, a) => sum + (a.value ?? 0), 0),
    unit,
  };
}

/**
 * Everything refreshCycleSummary writes to a PlantCycle, computed from its
 * entries (oldest first). The texts are saved in English (and as advice keys,
 * which reads render in the gardener's language).
 */
export function buildCycleSnapshot(
  journal_entries: CycleEntry[],
  catalogue: Pick<Catalogue, 'advice' | 'adviceHasHindi'>,
) {
  const flowering =
    journal_entries.find((log) => log.type === LogType.FLOWERING)?.timestamp ??
    null;
  const fruitSet =
    journal_entries.find((log) => log.type === LogType.FRUIT_SET)?.timestamp ??
    null;
  const harvestLogs = journal_entries.filter(
    (log) => log.type === LogType.HARVEST,
  );
  const flowerDropLevel = maxDropLevel(
    journal_entries
      .filter((log) => log.type === LogType.FLOWER_DROP)
      .map((log) => parseDropLevel(log.metadata, 'severity')),
  );
  const fruitDropLevel = maxDropLevel(
    journal_entries
      .filter((log) => log.type === LogType.FRUIT_DROP)
      .map((log) => parseDropLevel(log.metadata, 'severity')),
  );
  const latestHarvestMetadata = harvestLogs.at(-1)?.metadata as
    | Record<string, unknown>
    | null
    | undefined;
  const { quantity: yieldQuantity, unit: yieldUnit } = seasonYield(harvestLogs);
  const yieldQuality = parseYieldQuality(latestHarvestMetadata?.quality);
  const stressScore = journal_entries.filter(
    (log) => log.type === LogType.WATERING_STRESS,
  ).length;
  const pestPressureScore = journal_entries.filter(
    (log) => log.type === LogType.PEST_DIAGNOSIS,
  ).length;
  const treatmentCount = journal_entries.filter(
    (log) => log.type === LogType.TREATMENT,
  ).length;

  const summary = buildCycleSummary({
    flowering,
    fruitSet,
    harvestCount: harvestLogs.length,
    flowerDropLevel,
    fruitDropLevel,
    stressScore,
    pestPressureScore,
  });

  const nextActions = buildRecommendedActions({
    flowering,
    fruitSet,
    harvestCount: harvestLogs.length,
    flowerDropLevel,
    fruitDropLevel,
    stressScore,
    pestPressureScore,
    treatmentCount,
  });

  return {
    observed_flowering_at: flowering,
    observed_fruit_set_at: fruitSet,
    harvest_started_at: harvestLogs[0]?.timestamp ?? null,
    harvest_completed_at: harvestLogs.at(-1)?.timestamp ?? null,
    yield_quantity: yieldQuantity,
    yield_unit: yieldUnit,
    yield_quality: yieldQuality,
    flower_drop_level: flowerDropLevel,
    fruit_drop_level: fruitDropLevel,
    stress_score: stressScore,
    pest_pressure_score: pestPressureScore,
    treatment_count: treatmentCount,
    cycle_summary: renderCycleSummary(summary, catalogue, 'en'),
    recommended_next_cycle_actions: nextActions.map((a) =>
      catalogue.advice(a, 'en'),
    ),
    cycle_summary_refs: summary,
    recommended_actions_refs: nextActions,
  };
}
