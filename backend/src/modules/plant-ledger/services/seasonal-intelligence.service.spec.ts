import { LifecycleStage, Plant } from '@prisma/client';
import { FixedClock } from '../../../common/time';
import { SeasonalIntelligenceService } from './seasonal-intelligence.service';
import { SpeciesNormalizationService } from './species-normalization.service';

const service = (iso: string) =>
  new SeasonalIntelligenceService(
    new SpeciesNormalizationService(),
    new FixedClock(new Date(iso)),
  );
const guava = {
  species: 'Guava',
  variety: null,
  name: 'Amrud',
  record_kind: 'TREE',
  lifecycle_stage: LifecycleStage.MATURE_BEARING,
} as unknown as Plant;
const user = { district: 'Bhopal', latitude: null, longitude: null };

describe('SeasonalIntelligenceService (families or regions still on season packs)', () => {
  it("keeps guava's own advice for guava regions pending a verified calendar", () => {
    const monsoon = service('2026-08-10T06:00:00Z').inferTreeSeasonalState(
      guava,
      user,
    );
    expect(monsoon.watch_for).toEqual(['Fruit fly', 'Wilt symptoms']);
    const summer = service('2026-05-10T06:00:00Z').inferTreeSeasonalState(
      guava,
      user,
    );
    expect(summer.watch_for).toEqual(['Fruit fly', 'Leaf scorch']);
  });
});
