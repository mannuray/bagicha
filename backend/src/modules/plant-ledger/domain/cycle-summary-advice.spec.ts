import { DropLevel } from '@prisma/client';
import { CATALOGUE_SEED } from '../../catalogue';
import { seededCatalogue } from '../../catalogue/testing';
import * as legacy from './__fixtures__/legacy-cycle-summary';
import {
  buildCycleSummary,
  buildRecommendedActions,
  renderCycleSummary,
} from './cycle-summary';

const catalogue = seededCatalogue();
const levels = [
  DropLevel.UNKNOWN,
  DropLevel.LOW,
  DropLevel.MEDIUM,
  DropLevel.HIGH,
];

function* inputs() {
  for (const flowering of [null, new Date('2026-02-01')])
    for (const fruitSet of [null, new Date('2026-03-01')])
      for (const harvestCount of [0, 1, 2, 5])
        for (const flowerDropLevel of levels)
          for (const fruitDropLevel of levels)
            for (const stressScore of [0, 1, 3])
              for (const pestPressureScore of [0, 2])
                for (const treatmentCount of [0, 1])
                  yield {
                    flowering,
                    fruitSet,
                    harvestCount,
                    flowerDropLevel,
                    fruitDropLevel,
                    stressScore,
                    pestPressureScore,
                    treatmentCount,
                  };
}

describe('season summary English after the move to the catalogue', () => {
  it('is byte-identical to the pre-catalogue summary and actions on every branch', () => {
    let n = 0;
    for (const input of inputs()) {
      expect(
        renderCycleSummary(buildCycleSummary(input), catalogue, 'en'),
      ).toBe(legacy.buildCycleSummary(input));
      expect(
        buildRecommendedActions(input).map((a) => catalogue.advice(a, 'en')),
      ).toEqual(legacy.buildRecommendedActions(input));
      n += 1;
    }
    expect(n).toBeGreaterThan(3000);
  });
});

describe('season summary in Hindi', () => {
  const noHindi = seededCatalogue({
    ...CATALOGUE_SEED,
    advice: CATALOGUE_SEED.advice.map(({ hi: _hi, ...a }) => a),
  });

  it('reads as plain English sentence while its pieces have no Hindi', () => {
    const parts = buildCycleSummary({
      flowering: new Date('2026-02-01'),
      fruitSet: null,
      harvestCount: 2,
      flowerDropLevel: DropLevel.UNKNOWN,
      fruitDropLevel: DropLevel.UNKNOWN,
      stressScore: 0,
      pestPressureScore: 0,
    });
    expect(renderCycleSummary(parts, noHindi, 'hi')).toBe(
      renderCycleSummary(parts, noHindi, 'en'),
    );
  });

  it('joins a fully Hindi summary with commas and ।', () => {
    const parts = buildCycleSummary({
      flowering: new Date('2026-02-01'),
      fruitSet: null,
      harvestCount: 2,
      flowerDropLevel: DropLevel.UNKNOWN,
      fruitDropLevel: DropLevel.UNKNOWN,
      stressScore: 0,
      pestPressureScore: 0,
    });
    expect(renderCycleSummary(parts, catalogue, 'hi')).toBe(
      'फूल आने की बात दर्ज हुई, पर फल लगने की पुष्टि नहीं हुई, 2 बार तुड़ाई दर्ज हुई।',
    );
  });
});
