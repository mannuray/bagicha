import { describe, expect, it } from 'vitest';
import { gardenCounts, plantCategory } from './category';

const p = (record_kind: 'TREE' | 'FLOWER' | 'CROP', crop_id: string | null) => ({ record_kind, crop_id });

describe('what kind of plant this is', () => {
  it('journey plants are crops or seasonal flowers; the rest are trees or perennial flowers', () => {
    expect(plantCategory(p('TREE', null))).toBe('tree');
    expect(plantCategory(p('CROP', 'tomato'))).toBe('crop');
    expect(plantCategory(p('FLOWER', 'marigold'))).toBe('seasonalFlower');
    expect(plantCategory(p('FLOWER', null))).toBe('perennialFlower');
  });

  it('counts the garden by kind', () => {
    expect(gardenCounts([p('TREE', null), p('TREE', null), p('CROP', 'okra'), p('FLOWER', 'marigold'), p('FLOWER', null)])).toEqual({
      tree: 2, crop: 1, seasonalFlower: 1, perennialFlower: 1, flowers: 2,
    });
  });
});

describe('usesSeasonPack', () => {
  it('trees and perennial flowers follow the tree season pack; journey plants follow the crop calendar', async () => {
    const { usesSeasonPack } = await import('./category');
    expect(usesSeasonPack(p('TREE', null))).toBe(true);
    expect(usesSeasonPack(p('FLOWER', null))).toBe(true);
    expect(usesSeasonPack(p('CROP', 'okra'))).toBe(false);
    expect(usesSeasonPack(p('FLOWER', 'marigold'))).toBe(false);
  });
});
