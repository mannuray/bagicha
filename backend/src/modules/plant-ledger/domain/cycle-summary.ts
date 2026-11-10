import { DropLevel, JournalEntry, LogType, YieldQuality } from '@prisma/client';

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

export function buildCycleSummary(input: {
  flowering: Date | null;
  fruitSet: Date | null;
  harvestCount: number;
  flowerDropLevel: DropLevel;
  fruitDropLevel: DropLevel;
  stressScore: number;
  pestPressureScore: number;
}): string {
  const parts: string[] = [];

  if (input.flowering) {
    parts.push('Flowering was recorded');
  } else {
    parts.push('No flowering record was added');
  }

  if (input.fruitSet) {
    parts.push('fruit set was observed');
  } else if (input.flowering) {
    parts.push('but fruit set was not confirmed');
  }

  if (input.harvestCount > 0) {
    parts.push(
      `and ${input.harvestCount} harvest event${input.harvestCount > 1 ? 's were' : ' was'} logged`,
    );
  }

  if (
    input.flowerDropLevel === DropLevel.HIGH ||
    input.fruitDropLevel === DropLevel.HIGH
  ) {
    parts.push('with high drop pressure during the cycle');
  }

  if (input.stressScore > 0 || input.pestPressureScore > 0) {
    parts.push(
      `while ${input.stressScore} stress and ${input.pestPressureScore} pest signals were recorded`,
    );
  }

  return `${parts.join(' ')}.`;
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
}): string[] {
  const actions: string[] = [];

  if (input.flowering && !input.fruitSet) {
    actions.push(
      'Inspect flowering closely next cycle and confirm fruit set early.',
    );
  }

  if (
    input.flowerDropLevel === DropLevel.MEDIUM ||
    input.flowerDropLevel === DropLevel.HIGH
  ) {
    actions.push(
      'Track flower drop severity early and stabilize watering during bloom.',
    );
  }

  if (
    input.fruitDropLevel === DropLevel.MEDIUM ||
    input.fruitDropLevel === DropLevel.HIGH
  ) {
    actions.push(
      'Watch fruit retention next cycle and log drop before harvest declines.',
    );
  }

  if (input.stressScore > 0) {
    actions.push(
      'Plan moisture checks around flowering and fruit-development windows.',
    );
  }

  if (input.pestPressureScore > 0 && input.treatmentCount === 0) {
    actions.push(
      'Add a follow-up treatment or inspection plan when pests are recorded.',
    );
  }

  if (input.harvestCount === 0) {
    actions.push(
      'Keep recording flowering, fruit set, and harvest to compare the next cycle properly.',
    );
  }

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
  const unit = amounts.at(-1)?.unit ?? null;
  const same = amounts.filter(
    (a) => a.value !== null && a.unit?.toLowerCase() === unit?.toLowerCase(),
  );
  if (same.length === 0) return { quantity: null, unit };
  return {
    quantity: same.reduce((sum, a) => sum + (a.value ?? 0), 0),
    unit,
  };
}

/** Everything refreshCycleSummary writes to a PlantCycle, computed from its entries (oldest first). */
export function buildCycleSnapshot(journal_entries: CycleEntry[]) {
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
    cycle_summary: summary,
    recommended_next_cycle_actions: nextActions,
  };
}
