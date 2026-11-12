import { LifecycleStage } from '@prisma/client';
import { NOT_GROWN_NOTE, treeCareDue } from './engine';
import type { CareItem, FamilyCare, MonthDay } from './types';

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
