import { Injectable } from '@nestjs/common';
import { LifecycleStage } from '@prisma/client';

@Injectable()
export class LifecycleService {
  /**
   * Calculates the current lifecycle stage based on planting date and species.
   * This is a simplified logic that can be expanded with species-specific data.
   */
  calculateStage(plantingDate: Date | null, species: string): LifecycleStage {
    if (!plantingDate) return LifecycleStage.SAPLING;

    const ageInYears =
      (new Date().getTime() - new Date(plantingDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365);

    // Default thresholds (can be species-specific later)
    if (ageInYears < 1) return LifecycleStage.SAPLING;
    if (ageInYears < 3) return LifecycleStage.JUVENILE;
    if (ageInYears < 5) return LifecycleStage.FIRST_FLOWERING;
    return LifecycleStage.MATURE_BEARING;
  }
}
