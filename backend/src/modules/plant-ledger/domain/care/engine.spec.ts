import { LifecycleStage } from '@prisma/client';
import { carePhaseView, NOT_GROWN_NOTE, treeCareDue } from './engine';
import type { CareItem, FamilyCare, MonthDay, PhaseWindow } from './types';

const ist = (s: string) => new Date(`${s}T06:00:00+05:30`);
const item = (
  key: string,
  from: MonthDay,
  to: MonthDay,
  over: Partial<CareItem> = {},
): CareItem => ({
  key,
  title: `Do ${key}`,
  category: 'GENERAL',
  stages: ['BEARING'],
  when: { kind: 'CALENDAR', from, to },
  organic: `organic ${key}`,
  why: `why ${key}`,
  ...over,
});
const family = (items: CareItem[]): FamilyCare => ({
  family: 'fixture',
  sources: ['test'],
  grownIn: ['NORTH_INDIA'],
  regions: { NORTH_INDIA: { items, phases: [] } },
});
const due = (
  items: CareItem[],
  now: string,
  over: Partial<Parameters<typeof treeCareDue>[1]> = {},
) =>
  treeCareDue(family(items), {
    region: 'NORTH_INDIA',
    stage: LifecycleStage.MATURE_BEARING,
    plantedAt: null,
    now: ist(now),
    ...over,
  });

describe('treeCareDue', () => {
  it('reminds items whose window is open now, due today', () => {
    const { reminders } = due([item('feed', [2, 1], [2, 28])], '2026-02-10');
    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({
      key: 'feed',
      sourceKey: 'fixture:feed:2026-02-01',
      organic: 'organic feed',
      why: 'why feed',
    });
    expect(reminders[0].due.toISOString()).toBe(
      ist('2026-02-10').toISOString(),
    );
    expect(reminders[0].windowEnd.toISOString()).toBe(
      '2026-02-27T18:30:00.000Z',
    );
  });

  it('reminds items opening within 30 days, due at the window start (midnight IST)', () => {
    const { reminders } = due(
      [item('spray', [3, 1], [3, 20]), item('later', [4, 1], [4, 10])],
      '2026-02-10',
    );
    expect(reminders.map((r) => r.key)).toEqual(['spray']);
    expect(reminders[0].due.toISOString()).toBe('2026-02-28T18:30:00.000Z');
  });

  it('ignores items for the other stage', () => {
    const { reminders } = due(
      [item('young', [2, 1], [2, 28], { stages: ['YOUNG'] })],
      '2026-02-10',
    );
    expect(reminders).toEqual([]);
  });

  it('crosses New Year as one occurrence', () => {
    const x = item('band', [12, 15], [1, 20]);
    const dec = due([x], '2026-12-20').reminders[0];
    const jan = due([x], '2027-01-05').reminders[0];
    expect(dec.sourceKey).toBe('fixture:band:2026-12-15');
    expect(jan.sourceKey).toBe('fixture:band:2026-12-15');
    expect(jan.windowEnd.toISOString()).toBe('2027-01-19T18:30:00.000Z');
  });

  it('caps at 3 by priority and never reminds conditional items', () => {
    const w: [MonthDay, MonthDay] = [
      [2, 1],
      [2, 28],
    ];
    const { reminders, onPage } = due(
      [
        item('general', ...w, { category: 'GENERAL' }),
        item('prune', ...w, { category: 'PRUNING' }),
        item('feed', ...w, { category: 'FEEDING' }),
        item('borer', ...w, {
          category: 'PROTECTION',
          conditional: 'If you see holes',
        }),
        item('spray', ...w, { category: 'PROTECTION' }),
      ],
      '2026-02-10',
    );
    expect(reminders.map((r) => r.key)).toEqual(['spray', 'feed', 'prune']);
    expect(onPage.map((i) => i.key).sort()).toEqual(['borer', 'general']);
  });

  it('picks the dose band by age, and by stage without a planting date', () => {
    const amounts = { upTo3y: 'small', y4to7: 'medium', y8plus: 'large' };
    const x = item('feed', [2, 1], [2, 28], {
      amounts,
      stages: ['YOUNG', 'BEARING'],
    });
    expect(
      due([x], '2026-02-10', { plantedAt: ist('2020-01-01') }).reminders[0]
        .amount,
    ).toBe('medium');
    expect(
      due([x], '2026-02-10', { plantedAt: ist('2015-01-01') }).reminders[0]
        .amount,
    ).toBe('large');
    expect(due([x], '2026-02-10').reminders[0].amount).toBe('medium');
    expect(
      due([x], '2026-02-10', { stage: LifecycleStage.SAPLING }).reminders[0]
        .amount,
    ).toBe('small');
  });

  it('uses the nearest grown region with a note', () => {
    const r = due([item('feed', [2, 1], [2, 28])], '2026-02-10', {
      region: 'HILLS_COOL',
    });
    expect(r.reminders).toHaveLength(1);
    expect(r.note).toBe(NOT_GROWN_NOTE);
    expect(NOT_GROWN_NOTE).toBe(
      'Not usually grown in your region; timings may differ.',
    );
    expect(due([item('feed', [2, 1], [2, 28])], '2026-02-10').note).toBeNull();
  });
});

const phase = (
  name: string,
  from: MonthDay,
  to: MonthDay,
  stages: PhaseWindow['stages'] = ['BEARING'],
): PhaseWindow => ({
  when: { kind: 'CALENDAR', from, to },
  stages,
  phase: name,
  avoid: [`avoid in ${name}`],
  watch: [`watch in ${name}`],
});
const view = (
  phases: PhaseWindow[],
  items: CareItem[],
  now: string,
  stage: LifecycleStage = LifecycleStage.MATURE_BEARING,
) =>
  carePhaseView(
    {
      family: 'fixture',
      sources: ['t'],
      grownIn: ['NORTH_INDIA'],
      regions: { NORTH_INDIA: { items, phases } },
    },
    { region: 'NORTH_INDIA', stage, now: ist(now) },
  );

describe('carePhaseView', () => {
  const phases = [
    phase('pre_flowering', [10, 15], [1, 31]),
    phase('flowering', [2, 1], [3, 31]),
    phase('summer_growth', [4, 1], [6, 30], ['YOUNG']),
  ];

  it('current and upcoming phase for the stage', () => {
    expect(view(phases, [], '2026-01-10')).toMatchObject({
      current_phase: 'pre_flowering',
      upcoming_phase: 'flowering',
    });
    expect(
      view(phases, [], '2026-04-10', LifecycleStage.SAPLING),
    ).toMatchObject({ current_phase: 'summer_growth' });
  });

  it('avoid and watch come from the current phase', () => {
    expect(view(phases, [], '2026-02-10')).toMatchObject({
      avoid_now: ['avoid in flowering'],
      watch_for: ['watch in flowering'],
    });
  });

  it('conditional items appear in do_now with the prefix', () => {
    const items = [
      item('spray', [2, 1], [2, 28]),
      item('borer', [2, 1], [2, 28], {
        conditional: 'If holes',
        title: 'Plug borer holes',
      }),
    ];
    expect(view(phases, items, '2026-02-10').do_now).toEqual([
      'Do spray',
      'If you see it: Plug borer holes',
    ]);
  });

  it("a gap between windows reads as the next window's phase in upcoming and 'growing' in current", () => {
    expect(view(phases, [], '2026-05-10')).toMatchObject({
      current_phase: 'growing',
      upcoming_phase: 'pre_flowering',
      avoid_now: [],
      watch_for: [],
    });
  });
});
