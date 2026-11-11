import { Injectable } from '@nestjs/common';
import { LifecycleStage } from '@prisma/client';
import { Clock } from '../../../common/time';
import { perennialFlower } from '../domain/flower-care';
import { lifeProfileFor } from '../domain/species-life-profiles';
import { SpeciesNormalizationService } from './species-normalization.service';

const ORDER: LifecycleStage[] = [
  LifecycleStage.SAPLING,
  LifecycleStage.JUVENILE,
  LifecycleStage.FIRST_FLOWERING,
  LifecycleStage.FIRST_HARVEST,
  LifecycleStage.MATURE_BEARING,
];
const MONTH_MS = (365.25 / 12) * 24 * 60 * 60 * 1000;

export interface StageInput {
  planting_date: Date | null;
  species: string;
  species_family?: string | null;
  record_kind?: string | null;
  first_flowering_at?: Date | null;
  first_fruit_set_at?: Date | null;
  first_harvest_at?: Date | null;
}

/** The later of two stages: automatic recalculation never moves a tree backwards. */
export function laterStage(
  a: LifecycleStage,
  b: LifecycleStage,
): LifecycleStage {
  return ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b;
}

@Injectable()
export class LifecycleService {
  constructor(
    private readonly clock: Clock,
    private readonly species: SpeciesNormalizationService,
  ) {}

  /**
   * The stage from age, timed by the species' life profile when we have one,
   * and never earlier than what the gardener has recorded (flowering, harvest).
   */
  calculateStage(input: StageInput): LifecycleStage {
    if (input.record_kind === 'FLOWER') return this.flowerStage(input);
    return laterStage(this.byAge(input), this.byMilestones(input));
  }

  /** Flowers are young, then blooming; never bearing (spec flowers §2.2). */
  private flowerStage(input: StageInput): LifecycleStage {
    if (input.first_flowering_at) return LifecycleStage.FIRST_FLOWERING;
    if (!input.planting_date) return LifecycleStage.JUVENILE;
    const months =
      (this.clock.now().getTime() - new Date(input.planting_date).getTime()) /
      MONTH_MS;
    const family = this.species.resolveSpeciesFamily({
      species: input.species,
      record_kind: 'FLOWER',
    });
    const [min] = perennialFlower(family)?.first_bloom_months ?? [6, 12];
    return months < min
      ? LifecycleStage.JUVENILE
      : LifecycleStage.FIRST_FLOWERING;
  }

  private byMilestones(input: StageInput): LifecycleStage {
    if (input.first_harvest_at) return LifecycleStage.FIRST_HARVEST;
    if (input.first_fruit_set_at || input.first_flowering_at)
      return LifecycleStage.FIRST_FLOWERING;
    return LifecycleStage.SAPLING;
  }

  private byAge(input: StageInput): LifecycleStage {
    if (!input.planting_date) return LifecycleStage.SAPLING;
    const months =
      (this.clock.now().getTime() - new Date(input.planting_date).getTime()) /
      MONTH_MS;
    const family =
      input.species_family ??
      this.species.resolveSpeciesFamily({ species: input.species });
    const profile = lifeProfileFor(family);
    if (!profile) {
      // No profile: the original age thresholds.
      if (months < 12) return LifecycleStage.SAPLING;
      if (months < 36) return LifecycleStage.JUVENILE;
      if (months < 60) return LifecycleStage.FIRST_FLOWERING;
      return LifecycleStage.MATURE_BEARING;
    }
    const [min, max] = profile.first_fruit_months;
    if (months < min / 2) return LifecycleStage.SAPLING;
    if (months < min) return LifecycleStage.JUVENILE;
    if (months <= max) return LifecycleStage.FIRST_FLOWERING;
    if (months <= max + 12) return LifecycleStage.FIRST_HARVEST;
    return LifecycleStage.MATURE_BEARING;
  }
}
