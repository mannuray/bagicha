import { describe, expect, it } from 'vitest';
import type { JournalEntry } from '../journal';
import { entryTags, groupByYear, TIMELINE_FILTERS } from './record-timeline';

const entry = (over: Partial<JournalEntry>): JournalEntry => ({
  id: 'j', type: 'NOTE', content: null, metadata: null, timestamp: '2026-03-10T05:00:00Z',
  recorded_at: '2026-03-10T05:00:00Z', plant_cycle_id: null, diagnosis_outcome_id: null, ...over,
});

describe('groupByYear', () => {
  it('groups by IST year, newest first, keeping order inside a year', () => {
    const groups = groupByYear([
      entry({ id: 'a', timestamp: '2026-03-10T05:00:00Z' }),
      entry({ id: 'b', timestamp: '2025-12-31T20:00:00Z' }),
      entry({ id: 'c', timestamp: '2025-06-01T05:00:00Z' }),
    ]);
    expect(groups.map((g) => [g.year, g.entries.map((e) => e.id)])).toEqual([
      [2026, ['a', 'b']],
      [2025, ['c']],
    ]);
  });
});

describe('entryTags', () => {
  it('tags a harvest with amount and quality', () => {
    expect(entryTags(entry({ type: 'HARVEST', metadata: { quantity_value: 120, quantity_unit: 'kg', quality: 'good' } }))).toEqual([
      { key: 'harvest', values: { amount: '120 kg', quality: 'good' } },
    ]);
  });
  it('reads the legacy quantity string', () => {
    expect(entryTags(entry({ type: 'HARVEST', metadata: { quantity: '3 kg' } }))).toEqual([{ key: 'harvest', values: { amount: '3 kg' } }]);
  });
  it('tags a drop with its severity', () => {
    expect(entryTags(entry({ type: 'FRUIT_DROP', metadata: { severity: 'HIGH' } }))).toEqual([{ key: 'drop', values: { severity: 'HIGH' } }]);
  });
  it('gives other entries no tags', () => {
    expect(entryTags(entry({ type: 'NOTE', metadata: { anything: 1 } }))).toEqual([]);
    expect(entryTags(entry({ type: 'HARVEST', metadata: null }))).toEqual([]);
  });
});

describe('TIMELINE_FILTERS', () => {
  it('has the spec families, with All sending no types', () => {
    expect(Object.fromEntries(TIMELINE_FILTERS.map((f) => [f.id, f.types]))).toEqual({
      all: [],
      care: ['WATERING', 'PRUNING', 'FEEDING', 'TREATMENT'],
      bloom: ['FLOWERING', 'FRUIT_SET', 'FLOWER_DROP', 'FRUIT_DROP', 'GERMINATION', 'THINNING', 'BOLTING'],
      harvest: ['HARVEST'],
      health: ['PEST_DIAGNOSIS', 'DIAGNOSIS', 'WATERING_STRESS', 'WEATHER_DAMAGE'],
      notes: ['NOTE', 'PHOTO', 'PLANTING', 'PLANT_ENDED', 'SOWING', 'TRANSPLANTING', 'SEASON_END'],
    });
  });
});
