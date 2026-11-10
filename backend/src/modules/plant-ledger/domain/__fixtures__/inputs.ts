import { DropLevel, LogType, TaskStatus } from '@prisma/client';

const d = (iso: string) => new Date(iso);

type Entry = {
  id: string;
  type: LogType;
  content: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
};

const entry = (
  id: string,
  type: LogType,
  ts: string,
  metadata: Record<string, unknown> | null = null,
  content: string | null = null,
): Entry => ({ id, type, content, metadata, timestamp: d(ts) });

/** Journal entries for one cycle, oldest first (the order summaries use). */
export const CYCLE_ENTRY_FIXTURES: Record<string, Entry[]> = {
  healthy: [
    entry('h1', LogType.FLOWERING, '2026-02-10T05:00:00Z'),
    entry('h2', LogType.FRUIT_SET, '2026-03-20T05:00:00Z'),
    entry('h3', LogType.WATERING, '2026-04-02T05:00:00Z'),
    entry('h4', LogType.HARVEST, '2026-06-01T05:00:00Z', {
      quantity_value: 42,
      quantity_unit: 'kg',
      quality: 'good',
    }),
    entry('h5', LogType.HARVEST, '2026-06-15T05:00:00Z', {
      quantity: '18 kg',
      quality: 'excellent',
    }),
  ],
  heavyDropWithPests: [
    entry('p1', LogType.FLOWERING, '2026-02-01T05:00:00Z'),
    entry('p2', LogType.FLOWER_DROP, '2026-02-20T05:00:00Z', {
      severity: 'high',
    }),
    entry(
      'p3',
      LogType.PEST_DIAGNOSIS,
      '2026-03-01T05:00:00Z',
      null,
      'mealybugs',
    ),
    entry('p4', LogType.TREATMENT, '2026-03-02T05:00:00Z', null, 'neem'),
    entry('p5', LogType.WATERING_STRESS, '2026-04-10T05:00:00Z'),
    entry('p6', LogType.WATERING_STRESS, '2026-04-20T05:00:00Z'),
    entry('p7', LogType.FRUIT_DROP, '2026-04-25T05:00:00Z', {
      severity: 'MEDIUM',
    }),
    entry('p8', LogType.PEST_DIAGNOSIS, '2026-05-01T05:00:00Z'),
    entry('p9', LogType.HARVEST, '2026-06-10T05:00:00Z', {
      quantity: 5,
      quality: 'poor',
      loss_category: 'fruit_drop',
    }),
  ],
  empty: [],
};

const cycle = (over: Record<string, unknown>) => ({
  id: 'c',
  cycle_year: 2026,
  fruit_drop_level: DropLevel.UNKNOWN,
  flower_drop_level: DropLevel.UNKNOWN,
  stress_score: null,
  pest_pressure_score: null,
  observed_flowering_at: null,
  observed_fruit_set_at: null,
  harvest_completed_at: null,
  yield_quantity: null,
  yield_unit: null,
  treatment_count: 0,
  ...over,
});

/** Inputs for the mitigation plan, mirroring what getMitigationPlan loads. */
export const MITIGATION_FIXTURES: Record<
  string,
  {
    latest: ReturnType<typeof cycle> | null;
    previous: ReturnType<typeof cycle> | null;
    recentHealthLogs: Array<{ type: LogType; content: string | null }>;
    latestCycleTasks: Array<{ status: TaskStatus; title: string | null }>;
    latestCycleLogs: Array<{
      type: LogType;
      metadata: Record<string, unknown> | null;
    }>;
  }
> = {
  healthy: {
    latest: cycle({
      observed_flowering_at: d('2026-02-10T05:00:00Z'),
      observed_fruit_set_at: d('2026-03-20T05:00:00Z'),
      harvest_completed_at: d('2026-06-15T05:00:00Z'),
      flower_drop_level: DropLevel.LOW,
      fruit_drop_level: DropLevel.LOW,
      stress_score: 0,
      pest_pressure_score: 0,
      yield_quantity: 60,
      yield_unit: 'kg',
    }),
    previous: cycle({
      cycle_year: 2025,
      observed_fruit_set_at: d('2025-03-25T05:00:00Z'),
      harvest_completed_at: d('2025-06-20T05:00:00Z'),
      stress_score: 1,
      pest_pressure_score: 0,
    }),
    recentHealthLogs: [],
    latestCycleTasks: [
      { status: TaskStatus.COMPLETED, title: 'Water the plant' },
      { status: TaskStatus.COMPLETED, title: 'Feed the plant' },
    ],
    latestCycleLogs: [{ type: LogType.HARVEST, metadata: { quality: 'good' } }],
  },
  heavyDropWithPests: {
    latest: cycle({
      observed_flowering_at: d('2026-02-01T05:00:00Z'),
      observed_fruit_set_at: null,
      flower_drop_level: DropLevel.HIGH,
      fruit_drop_level: DropLevel.MEDIUM,
      stress_score: 2,
      pest_pressure_score: 2,
      treatment_count: 1,
    }),
    previous: cycle({
      cycle_year: 2025,
      observed_fruit_set_at: d('2025-03-25T05:00:00Z'),
      harvest_completed_at: d('2025-06-20T05:00:00Z'),
      stress_score: 0,
      pest_pressure_score: 0,
    }),
    recentHealthLogs: [
      { type: LogType.PEST_DIAGNOSIS, content: 'mealybugs' },
      { type: LogType.WATERING_STRESS, content: null },
      { type: LogType.TREATMENT, content: 'neem' },
    ],
    latestCycleTasks: [
      { status: TaskStatus.SKIPPED, title: 'Plan pest response for Aam' },
      { status: TaskStatus.PENDING, title: 'Water the plant' },
      {
        status: TaskStatus.COMPLETED,
        title: 'Recheck treatment outcome on Aam',
      },
    ],
    latestCycleLogs: [
      { type: LogType.FLOWER_DROP, metadata: { severity: 'high' } },
      { type: LogType.HARVEST, metadata: { loss_category: 'fruit_drop' } },
    ],
  },
  empty: {
    latest: null,
    previous: null,
    recentHealthLogs: [],
    latestCycleTasks: [],
    latestCycleLogs: [],
  },
};
