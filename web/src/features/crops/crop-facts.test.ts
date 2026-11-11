import { describe, expect, it } from 'vitest';
import { cropFacts } from './names';

const base = { kind: 'CROP', method: 'DIRECT_SOW', germination_days: [5, 8] as [number, number], transplant_after_days: null, days_to_first_harvest: [45, 60] as [number, number], harvest_span_days: null };

describe('cropFacts: the crop page\'s quick facts', () => {
  it('a direct-sown vegetable: germination and first harvest', () => {
    expect(cropFacts(base)).toEqual([
      { icon: 'psychiatry', labelKey: 'crops.detail.germinates', range: [5, 8] },
      { icon: 'nutrition', labelKey: 'crops.detail.firstHarvest', range: [45, 60] },
    ]);
  });

  it('a nursery crop adds when to transplant; facts without a value are left out', () => {
    expect(cropFacts({ ...base, method: 'NURSERY_TRANSPLANT', transplant_after_days: [25, 30], germination_days: null }).map((f) => f.labelKey)).toEqual([
      'crops.detail.transplantAt',
      'crops.detail.firstHarvest',
    ]);
  });

  it('a flower blooms instead of harvesting, and says how long', () => {
    expect(cropFacts({ ...base, kind: 'FLOWER', harvest_span_days: 90 }).slice(1)).toEqual([
      { icon: 'local_florist', labelKey: 'crops.detail.firstBloom', range: [45, 60] },
      { icon: 'event_repeat', labelKey: 'crops.detail.bloomsFor', days: 90 },
    ]);
  });
});
