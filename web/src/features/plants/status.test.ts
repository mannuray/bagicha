import { describe, expect, it } from 'vitest';
import { cropDay, cropStageKey, flowerStage, plantStatus } from './status';

const NOW = new Date('2026-11-12T06:30:00Z');

describe('shared plant status rules', () => {
  it('flowerStage: young, then blooming', () => {
    expect(flowerStage('SAPLING')).toBe('YOUNG');
    expect(flowerStage('JUVENILE')).toBe('YOUNG');
    expect(flowerStage('MATURE_BEARING')).toBe('BLOOMING');
  });

  it('cropStageKey: a flower harvesting is blooming', () => {
    expect(cropStageKey('HARVESTING', 'FLOWER')).toBe('crops.stage.BLOOMING');
    expect(cropStageKey('HARVESTING', 'VEGETABLE')).toBe('crops.stage.HARVESTING');
    expect(cropStageKey('NURSERY', null)).toBe('crops.stage.NURSERY');
  });

  it('cropDay: IST days into the season, only while it is growing', () => {
    expect(cropDay('IN_GROUND', '2026-11-02T06:30:00Z', NOW)).toBe(10);
    expect(cropDay('PLANNED', '2026-11-02T06:30:00Z', NOW)).toBeNull();
    expect(cropDay('RESTING', '2026-11-02T06:30:00Z', NOW)).toBeNull();
    expect(cropDay('NURSERY', null, NOW)).toBeNull();
  });

  it('plantStatus: a growing crop, a perennial flower, a tree', () => {
    expect(plantStatus({ record_kind: 'CROP', crop_stage: 'HARVESTING', season_started_at: '2026-10-03T06:30:00Z', lifecycle_stage: 'SAPLING', planting_date: null, planting_date_precision: 'UNKNOWN' }, NOW))
      .toEqual({ stageKey: 'crops.stage.HARVESTING', day: 40, plantedYear: null });
    expect(plantStatus({ record_kind: 'FLOWER', crop_stage: null, season_started_at: null, lifecycle_stage: 'JUVENILE', planting_date: '2024-01-01T00:00:00Z', planting_date_precision: 'YEAR' }, NOW))
      .toEqual({ stageKey: 'biography.flower.stage.YOUNG', day: null, plantedYear: 2024 });
    expect(plantStatus({ record_kind: 'TREE', crop_stage: null, season_started_at: null, lifecycle_stage: 'MATURE_BEARING', planting_date: '2015-01-01T00:00:00Z', planting_date_precision: 'UNKNOWN' }, NOW))
      .toEqual({ stageKey: 'plants.stage.MATURE_BEARING', day: null, plantedYear: null });
  });
});
