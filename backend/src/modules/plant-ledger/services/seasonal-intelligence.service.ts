import { Injectable } from '@nestjs/common';
import { LifecycleStage, Plant, User } from '@prisma/client';
import { SpeciesNormalizationService } from './species-normalization.service';

type Confidence = 'low' | 'medium' | 'high';

export interface TreeSeasonalState {
  species_family: string;
  current_phase: string;
  upcoming_phase: string;
  confidence: Confidence;
  do_now: string[];
  avoid_now: string[];
  watch_for: string[];
  next_checkpoint_days: number;
  basis: string;
}

interface SeasonalRuleOutput {
  current_phase: string;
  upcoming_phase: string;
  do_now: string[];
  avoid_now: string[];
  watch_for: string[];
  next_checkpoint_days: number;
}

@Injectable()
export class SeasonalIntelligenceService {
  constructor(private speciesNormalizationService: SpeciesNormalizationService) {}

  inferTreeSeasonalState(plant: Plant, user: Pick<User, 'district' | 'latitude' | 'longitude'>): TreeSeasonalState {
    const month = new Date().getMonth() + 1;
    const speciesFamily = this.speciesNormalizationService.resolveSpeciesFamily(plant);
    const seasonalWindow = this.resolveSeasonalWindow(month, user.district);

    const guidance = this.buildGuidance(speciesFamily, plant.lifecycle_stage, seasonalWindow);
    const speciesBasis = this.speciesNormalizationService.buildClassificationBasis(plant);

    return {
      species_family: speciesFamily,
      current_phase: guidance.current_phase,
      upcoming_phase: guidance.upcoming_phase,
      confidence: this.resolveConfidence(speciesFamily, user),
      do_now: guidance.do_now,
      avoid_now: guidance.avoid_now,
      watch_for: guidance.watch_for,
      next_checkpoint_days: guidance.next_checkpoint_days,
      basis: `month_window+species_rule+lifecycle_stage+${speciesBasis}${user.district ? '+district' : ''}`,
    };
  }

  private resolveSeasonalWindow(month: number, district?: string | null): 'late_winter' | 'spring' | 'summer' | 'monsoon' | 'post_monsoon' {
    if (month === 1 || month === 2) return 'late_winter';
    if (month === 3 || month === 4) return 'spring';
    if (month === 5 || month === 6) return 'summer';
    if (month >= 7 && month <= 9) return 'monsoon';
    return 'post_monsoon';
  }

  private resolveConfidence(speciesFamily: string, user: Pick<User, 'district' | 'latitude' | 'longitude'>): Confidence {
    if (speciesFamily === 'generic_perennial') return 'low';
    if (user.district || (user.latitude != null && user.longitude != null)) return 'medium';
    return 'low';
  }

  private buildGuidance(
    speciesFamily: string,
    lifecycleStage: LifecycleStage,
    seasonalWindow: 'late_winter' | 'spring' | 'summer' | 'monsoon' | 'post_monsoon',
  ): SeasonalRuleOutput {
    switch (speciesFamily) {
      case 'mango':
        return this.mangoGuidance(lifecycleStage, seasonalWindow);
      case 'citrus':
        return this.citrusGuidance(lifecycleStage, seasonalWindow);
      case 'litchi':
        return this.litchiGuidance(lifecycleStage, seasonalWindow);
      case 'guava':
        return this.guavaGuidance(lifecycleStage, seasonalWindow);
      default:
        return this.genericGuidance(lifecycleStage, seasonalWindow);
    }
  }

  private mangoGuidance(stage: LifecycleStage, window: string): SeasonalRuleOutput {
    if (window === 'late_winter') {
      return {
        current_phase: stage === LifecycleStage.MATURE_BEARING ? 'pre_flowering' : 'vegetative_growth',
        upcoming_phase: stage === LifecycleStage.MATURE_BEARING ? 'flowering' : 'juvenile_flush',
        do_now: [
          'Inspect new terminals for bud initiation',
          'Keep watering steady but not excessive',
          'Clean up diseased leaf litter around the base',
        ],
        avoid_now: ['Do not do heavy pruning', 'Avoid excess nitrogen close to flowering'],
        watch_for: ['Powdery mildew', 'Mango hoppers'],
        next_checkpoint_days: 7,
      };
    }
    if (window === 'spring') {
      return {
        current_phase: stage === LifecycleStage.MATURE_BEARING ? 'flowering_or_fruit_set' : 'active_growth',
        upcoming_phase: 'fruit_development',
        do_now: [
          'Watch panicles and fruit set closely',
          'Keep moisture stable during dry spells',
          'Remove visibly diseased inflorescences early',
        ],
        avoid_now: ['Avoid canopy shock from pruning', 'Do not waterlog roots'],
        watch_for: ['Anthracnose', 'Fruit drop'],
        next_checkpoint_days: 5,
      };
    }
    if (window === 'summer') {
      return {
        current_phase: 'fruit_development_or_harvest_window',
        upcoming_phase: 'post_harvest_recovery',
        do_now: [
          'Harvest mature fruit promptly',
          'Protect fruiting branches from stress',
          'Deep-water during heat stress if soil is dry',
        ],
        avoid_now: ['Avoid severe pruning during harvest window', 'Avoid missed harvests on ripened fruit'],
        watch_for: ['Fruit cracking', 'Heat stress'],
        next_checkpoint_days: 4,
      };
    }
    if (window === 'monsoon') {
      return {
        current_phase: 'post_harvest_recovery',
        upcoming_phase: 'vegetative_flush',
        do_now: [
          'Support recovery nutrition after harvest',
          'Monitor drainage around root zone',
          'Remove damaged twigs selectively',
        ],
        avoid_now: ['Avoid standing water', 'Avoid dense canopies that trap moisture'],
        watch_for: ['Fungal leaf disease', 'Root stress'],
        next_checkpoint_days: 10,
      };
    }
    return {
      current_phase: 'vegetative_flush',
      upcoming_phase: 'pre_flowering',
      do_now: ['Shape lightly if needed', 'Build plant vigor gradually', 'Inspect for pest carryover'],
      avoid_now: ['Avoid overfeeding', 'Avoid weak sanitation around canopy'],
      watch_for: ['Scale insects', 'Leaf spot'],
      next_checkpoint_days: 14,
    };
  }

  private citrusGuidance(stage: LifecycleStage, window: string): SeasonalRuleOutput {
    if (window === 'late_winter' || window === 'spring') {
      return {
        current_phase: 'flowering_cycle',
        upcoming_phase: 'fruit_set',
        do_now: [
          'Watch for flower flush and early fruit set',
          'Maintain even watering',
          'Feed lightly only if plant is not stressed',
        ],
        avoid_now: ['Avoid hard pruning during bloom', 'Avoid alternating drought and flood'],
        watch_for: ['Citrus canker', 'Leaf miner'],
        next_checkpoint_days: 7,
      };
    }
    if (window === 'summer') {
      return {
        current_phase: 'fruit_development',
        upcoming_phase: 'continued_fruiting',
        do_now: ['Deep-water in hot spells', 'Inspect leaves for stress', 'Support fruit-bearing branches if needed'],
        avoid_now: ['Avoid letting containers or soil dry out too hard', 'Avoid overwatering low-drainage spots'],
        watch_for: ['Leaf curl', 'Sun stress', 'Mealybugs'],
        next_checkpoint_days: 5,
      };
    }
    if (window === 'monsoon') {
      return {
        current_phase: 'active_fruiting_or_flush',
        upcoming_phase: 'recovery_flush',
        do_now: ['Keep drainage clear', 'Inspect for disease after rain', 'Remove infected leaves early'],
        avoid_now: ['Avoid stagnant water', 'Avoid dense, airless canopy zones'],
        watch_for: ['Canker flare-ups', 'Root rot'],
        next_checkpoint_days: 7,
      };
    }
    return this.genericGuidance(stage, window);
  }

  private litchiGuidance(stage: LifecycleStage, window: string): SeasonalRuleOutput {
    if (window === 'late_winter' || window === 'spring') {
      return {
        current_phase: stage === LifecycleStage.MATURE_BEARING ? 'flowering' : 'vegetative_growth',
        upcoming_phase: 'fruit_set',
        do_now: ['Observe inflorescence growth', 'Protect moisture consistency', 'Inspect panicles often'],
        avoid_now: ['Avoid heavy pruning during bloom', 'Avoid stress watering'],
        watch_for: ['Mildew', 'Panicle blight'],
        next_checkpoint_days: 6,
      };
    }
    if (window === 'summer') {
      return {
        current_phase: 'fruit_development_or_harvest_window',
        upcoming_phase: 'post_harvest_recovery',
        do_now: ['Harvest promptly at maturity', 'Maintain moisture through heat', 'Reduce branch stress'],
        avoid_now: ['Avoid delayed harvest', 'Avoid heat-stress neglect'],
        watch_for: ['Fruit cracking', 'Sun stress'],
        next_checkpoint_days: 4,
      };
    }
    return this.genericGuidance(stage, window);
  }

  private guavaGuidance(stage: LifecycleStage, window: string): SeasonalRuleOutput {
    if (window === 'monsoon' || window === 'post_monsoon') {
      return {
        current_phase: 'flush_or_flowering_window',
        upcoming_phase: 'fruit_set',
        do_now: ['Encourage clean new growth', 'Inspect for pest pressure after rain', 'Keep the root zone aerated'],
        avoid_now: ['Avoid dense waterlogged zones', 'Avoid neglecting sanitation'],
        watch_for: ['Fruit fly', 'Wilt symptoms'],
        next_checkpoint_days: 7,
      };
    }
    if (window === 'summer') {
      return {
        current_phase: 'fruiting_or_stress_management',
        upcoming_phase: 'flush',
        do_now: ['Water deeply during heat', 'Thin weak stressed growth only if necessary', 'Inspect fruit health'],
        avoid_now: ['Avoid severe water stress', 'Avoid overloading weak branches'],
        watch_for: ['Fruit fly', 'Leaf scorch'],
        next_checkpoint_days: 6,
      };
    }
    return this.genericGuidance(stage, window);
  }

  private genericGuidance(stage: LifecycleStage, window: string): SeasonalRuleOutput {
    return {
      current_phase: window === 'summer' ? 'stress_management' : 'seasonal_growth_window',
      upcoming_phase: stage === LifecycleStage.MATURE_BEARING ? 'productive_phase' : 'continued_growth',
      do_now: [
        'Inspect new growth and branch health',
        'Maintain moisture consistency',
        'Log visible changes so guidance can improve later',
      ],
      avoid_now: ['Avoid severe pruning without need', 'Avoid irregular watering patterns'],
      watch_for: ['Pest pressure', 'Leaf disease after weather swings'],
      next_checkpoint_days: 7,
    };
  }
}
