import { DropLevel, LogType, TaskStatus } from '@prisma/client';
import { seededCatalogue } from '../../catalogue/testing';
import { MitigationPlanner as LegacyPlanner } from './__fixtures__/legacy-mitigation-planner';
import {
  MitigationPlanner,
  renderPlan,
  type MitigationInput,
} from './mitigation-planner';

const catalogue = seededCatalogue();
const levels = [
  DropLevel.UNKNOWN,
  DropLevel.LOW,
  DropLevel.MEDIUM,
  DropLevel.HIGH,
];
const d = (iso: string) => new Date(iso);

/** Every branch the planner has, crossed: the English must not change by a byte. */
function* inputs(): Generator<MitigationInput> {
  for (const flowering of [null, d('2026-02-01')])
    for (const fruitSet of [null, d('2026-03-01')])
      for (const flowerDrop of levels)
        for (const fruitDrop of [DropLevel.UNKNOWN, DropLevel.HIGH])
          for (const stress of [null, 0, 2])
            for (const pests of [0, 3])
              for (const previous of [
                null,
                {
                  cycle_year: 2025,
                  stress_score: 1,
                  pest_pressure_score: 1,
                  observed_fruit_set_at: d('2025-03-01'),
                  harvest_completed_at: d('2025-06-01'),
                },
              ])
                for (const loss of [
                  null,
                  'CRACKING',
                  'PEST_DAMAGE',
                  'ROT',
                  'BIRD_DAMAGE',
                  'WEATHER_DAMAGE',
                ])
                  yield {
                    latest: {
                      cycle_year: 2026,
                      observed_flowering_at: flowering,
                      observed_fruit_set_at: fruitSet,
                      flower_drop_level: flowerDrop,
                      fruit_drop_level: fruitDrop,
                      stress_score: stress,
                      pest_pressure_score: pests,
                    },
                    previous,
                    recentHealthLogs: [
                      { type: LogType.DIAGNOSIS, content: null },
                      { type: LogType.TREATMENT, content: null },
                      { type: LogType.PEST_DIAGNOSIS, content: null },
                    ].slice(0, pests ? 3 : 0),
                    latestCycleTasks: [
                      { status: TaskStatus.SKIPPED, title: null },
                      { status: TaskStatus.PENDING, title: null },
                      { status: TaskStatus.COMPLETED, title: null },
                    ].slice(0, stress ? 3 : 1),
                    latestCycleLogs: loss
                      ? [
                          {
                            type: LogType.HARVEST,
                            metadata: { loss_category: loss },
                          },
                        ]
                      : [],
                  } as unknown as MitigationInput;
}

describe('mitigation plan English after the move to the catalogue', () => {
  it('is byte-identical to the pre-catalogue planner on every branch', () => {
    const legacy = new LegacyPlanner();
    const planner = new MitigationPlanner();
    let n = 0;
    for (const input of inputs()) {
      expect(renderPlan(planner.plan(input), catalogue, 'en')).toEqual(
        legacy.plan(input as never),
      );
      n += 1;
    }
    expect(n).toBeGreaterThan(1000);
    const empty = {
      latest: null,
      previous: null,
      recentHealthLogs: [],
      latestCycleTasks: [],
      latestCycleLogs: [],
    };
    expect(renderPlan(planner.plan(empty), catalogue, 'en')).toEqual(
      legacy.plan(empty as never),
    );
  });

  it('uses only keys the catalogue has', () => {
    const keys = new Set(catalogue.adviceKeys());
    const planner = new MitigationPlanner();
    const used = new Set<string>();
    const walk = (r: { key: string; params?: Record<string, unknown> }) => {
      used.add(r.key);
      for (const v of Object.values(r.params ?? {}))
        if (v && typeof v === 'object') walk(v as { key: string });
    };
    for (const input of inputs()) {
      const plan = planner.plan(input);
      [
        plan.summary,
        ...plan.likely_issues,
        ...plan.what_to_change,
        ...plan.watch_early,
        ...plan.priority_actions,
      ].forEach(walk);
    }
    expect([...used].filter((k) => !keys.has(k))).toEqual([]);
  });
});
