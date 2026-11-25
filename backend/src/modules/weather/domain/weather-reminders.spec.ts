import type { AdviceRef } from '../../catalogue';
import { reminderDrafts, type ReminderPlant } from './weather-reminders';
import type { WeatherEvent } from './weather-events';

const en = (ref: AdviceRef) =>
  `${ref.key}${ref.params ? JSON.stringify(ref.params) : ''}`;

const tree = (d: Partial<ReminderPlant> = {}): ReminderPlant => ({
  id: 'p1',
  record_kind: 'TREE',
  lifecycle_stage: 'MATURE_BEARING',
  crop_stage: null,
  ...d,
});
const heat: WeatherEvent = { kind: 'HEAT', date: '2026-05-11', value: 41.6 };
const rain: WeatherEvent = {
  kind: 'HEAVY_RAIN',
  date: '2026-07-20',
  value: 82.34,
};
const cold: WeatherEvent = {
  kind: 'COLD_NIGHT',
  date: '2027-01-05',
  value: 3.2,
};

describe('reminderDrafts', () => {
  it('turns a very hot day into a high-priority watering reminder due that day', () => {
    const [draft] = reminderDrafts([heat], [tree()], en);
    expect(draft).toEqual({
      plantId: 'p1',
      draft: {
        type: 'WATER',
        category: 'WATERING',
        priority: 'HIGH',
        source: 'WEATHER',
        sourceKey: 'weather:HEAT:p1:2026-05-11',
        dueDate: new Date('2026-05-11T00:00:00+05:30'),
        title: 'weather.task.heat.title',
        reason: 'weather.task.heat.reason{"max":42}',
        metadata: {
          advice: {
            title: { key: 'weather.task.heat.title' },
            reason: { key: 'weather.task.heat.reason', params: { max: 42 } },
            summary: { key: 'weather.tip.heat' },
          },
          weather: { kind: 'HEAT', date: '2026-05-11', value: 41.6 },
        },
      },
    });
  });

  it('keys reminders by the date of the weather, so seeing it again tomorrow adds nothing', () => {
    const [a] = reminderDrafts([heat], [tree()], en);
    const [b] = reminderDrafts([{ ...heat, value: 43 }], [tree()], en);
    expect(a.draft.sourceKey).toBe(b.draft.sourceKey);
  });

  it('turns heavy rain into an inspection reminder with whole millimetres', () => {
    const [draft] = reminderDrafts([rain], [tree()], en);
    expect(draft.draft).toMatchObject({
      type: 'INSPECT',
      category: 'INSPECTION',
      reason: 'weather.task.heavy_rain.reason{"mm":82}',
    });
  });

  it('sends heat and rain reminders to every growing plant, but none to a crop not in the ground', () => {
    const plants = [
      tree({ id: 'old-tree' }),
      tree({ id: 'flower', record_kind: 'FLOWER', lifecycle_stage: 'SAPLING' }),
      tree({ id: 'tomato', record_kind: 'CROP', crop_stage: 'IN_GROUND' }),
      tree({ id: 'planned', record_kind: 'CROP', crop_stage: 'PLANNED' }),
      tree({ id: 'resting', record_kind: 'CROP', crop_stage: 'RESTING' }),
    ];
    expect(reminderDrafts([heat], plants, en).map((d) => d.plantId)).toEqual([
      'old-tree',
      'flower',
      'tomato',
    ]);
  });

  it('sends cold-night reminders only to young trees, growing crops and flowers', () => {
    const plants = [
      tree({ id: 'mature', lifecycle_stage: 'MATURE_BEARING' }),
      tree({ id: 'sapling', lifecycle_stage: 'SAPLING' }),
      tree({ id: 'juvenile', lifecycle_stage: 'JUVENILE' }),
      tree({ id: 'nursery', record_kind: 'CROP', crop_stage: 'NURSERY' }),
      tree({ id: 'harvesting', record_kind: 'CROP', crop_stage: 'HARVESTING' }),
      tree({ id: 'flower', record_kind: 'FLOWER' }),
      tree({ id: 'planned', record_kind: 'CROP', crop_stage: 'PLANNED' }),
    ];
    expect(reminderDrafts([cold], plants, en).map((d) => d.plantId)).toEqual([
      'sapling',
      'juvenile',
      'nursery',
      'harvesting',
      'flower',
    ]);
    expect(
      reminderDrafts([cold], [tree({ lifecycle_stage: 'SAPLING' })], en)[0]
        .draft.reason,
    ).toBe('weather.task.cold_night.reason{"min":3}');
  });

  it('makes one reminder per plant per event', () => {
    const drafts = reminderDrafts(
      [rain, heat],
      [tree({ id: 'a' }), tree({ id: 'b' })],
      en,
    );
    expect(drafts.map((d) => d.draft.sourceKey)).toEqual([
      'weather:HEAVY_RAIN:a:2026-07-20',
      'weather:HEAVY_RAIN:b:2026-07-20',
      'weather:HEAT:a:2026-05-11',
      'weather:HEAT:b:2026-05-11',
    ]);
  });
});
