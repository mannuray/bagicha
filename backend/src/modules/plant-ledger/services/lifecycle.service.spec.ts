import { LifecycleStage } from '@prisma/client';
import { FixedClock } from '../../../common/time';
import { laterStage, LifecycleService } from './lifecycle.service';
import { SpeciesNormalizationService } from './species-normalization.service';

const NOW = new Date('2026-11-10T06:00:00Z');
const monthsAgo = (m: number) => {
  const d = new Date(NOW);
  d.setUTCMonth(d.getUTCMonth() - m);
  return d;
};
const service = new LifecycleService(
  new FixedClock(NOW),
  new SpeciesNormalizationService(),
);
const stage = (
  species: string,
  months: number | null,
  extra: Record<string, Date> = {},
) =>
  service.calculateStage({
    planting_date: months === null ? null : monthsAgo(months),
    species,
    ...extra,
  });

describe('LifecycleService.calculateStage', () => {
  it('times papaya by its own profile', () => {
    expect(stage('Papaya', 3)).toBe(LifecycleStage.SAPLING);
    expect(stage('Papaya', 10)).toBe(LifecycleStage.FIRST_FLOWERING);
    expect(stage('Papaya', 48)).toBe(LifecycleStage.MATURE_BEARING);
  });

  it('times mango by its own profile', () => {
    expect(stage('Mango', 24)).toBe(LifecycleStage.JUVENILE);
    expect(stage('Mango', 48)).toBe(LifecycleStage.FIRST_FLOWERING);
    expect(stage('Mango', 84)).toBe(LifecycleStage.MATURE_BEARING);
  });

  it('lets recorded milestones beat age', () => {
    expect(stage('Mango', 24, { first_harvest_at: monthsAgo(1) })).toBe(
      LifecycleStage.FIRST_HARVEST,
    );
    expect(stage('Mango', 24, { first_flowering_at: monthsAgo(1) })).toBe(
      LifecycleStage.FIRST_FLOWERING,
    );
  });

  it('keeps the old thresholds for species without a profile', () => {
    expect(stage('Rose', 48)).toBe(LifecycleStage.FIRST_FLOWERING);
    expect(stage('Rose', 72)).toBe(LifecycleStage.MATURE_BEARING);
  });

  it('starts as a sapling without a planting date', () => {
    expect(stage('Mango', null)).toBe(LifecycleStage.SAPLING);
  });
});

describe('laterStage', () => {
  it('never goes backwards', () => {
    expect(
      laterStage(LifecycleStage.MATURE_BEARING, LifecycleStage.FIRST_HARVEST),
    ).toBe(LifecycleStage.MATURE_BEARING);
    expect(
      laterStage(LifecycleStage.JUVENILE, LifecycleStage.FIRST_FLOWERING),
    ).toBe(LifecycleStage.FIRST_FLOWERING);
  });
});

describe('flowers', () => {
  const flowerStage = (
    species: string,
    months: number,
    extra: Record<string, Date> = {},
  ) =>
    service.calculateStage({
      planting_date: monthsAgo(months),
      species,
      record_kind: 'FLOWER',
      ...extra,
    });

  it('a flower is young, then flowering, never bearing', () => {
    expect(flowerStage('Rose', 2)).toBe(LifecycleStage.JUVENILE);
    expect(flowerStage('Rose', 6)).toBe(LifecycleStage.FIRST_FLOWERING);
    expect(flowerStage('Rose', 120)).toBe(LifecycleStage.FIRST_FLOWERING);
    expect(
      flowerStage('Plumeria', 3, { first_flowering_at: monthsAgo(1) }),
    ).toBe(LifecycleStage.FIRST_FLOWERING);
    expect(flowerStage('Lotus', 3)).toBe(LifecycleStage.JUVENILE);
  });
});
