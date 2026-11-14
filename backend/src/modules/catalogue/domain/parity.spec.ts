import { readFileSync } from 'fs';
import { join } from 'path';
import { CROPS } from '../../plant-ledger/domain/crop-calendar';
import { CATALOGUE_SEED } from '../seed';
import { Catalogue } from './catalogue';
import { validateSeed } from './schemas';

/** Stage 1 switch-over guard: the seed gives exactly what the code constants give today. */
const en = JSON.parse(
  readFileSync(
    join(__dirname, '../../../../../web/src/locales/en.json'),
    'utf8',
  ),
) as { crops: Record<string, Record<string, unknown>> };
const catalogue = Catalogue.from(validateSeed(CATALOGUE_SEED), 1);

describe('catalogue seed matches the code calendar', () => {
  it('lists every crop and flower, in order, field for field', () => {
    expect(catalogue.listedCrops()).toEqual(CROPS);
  });

  it('keeps the planting materials and journey shapes', () => {
    expect(catalogue.method('TUBER').material).toBe('seed potatoes');
    expect(catalogue.method('CLOVE').material).toBe('garlic cloves');
    expect(catalogue.method('RHIZOME').material).toBe('healthy rhizomes');
    expect(catalogue.method('NURSERY_TRANSPLANT').journey).toBe('NURSERY');
    expect(catalogue.method('DIRECT_SOW').journey).toBe('DIRECT');
    for (const key of ['TUBER', 'CLOVE', 'RHIZOME'])
      expect(catalogue.method(key).journey).toBe('PLANT');
  });

  it('keeps the care-step reminder titles', () => {
    const titles: Record<string, string> = {
      stake: 'Stake the tomato plants',
      earth_up: 'Earth up the tomato',
      trellis: 'Give the tomato a trellis to climb',
      support: 'Give the tomato support to climb',
      pinch: 'Pinch the tomato tips for a bushier plant',
      deadhead: 'Deadhead the tomato to keep it blooming',
    };
    for (const [key, title] of Object.entries(titles))
      expect(catalogue.careStep(key)?.title.replace('{name}', 'tomato')).toBe(
        title,
      );
  });

  it('carries the web labels for methods and care steps', () => {
    const steps = en.crops.steps as Record<
      string,
      { title: string; body: string }
    > & { material: Record<string, { title: string; body: string }> };
    for (const step of CATALOGUE_SEED.careSteps)
      expect([step.label_title, step.label_body]).toEqual([
        steps[step.key].title,
        steps[step.key].body,
      ]);
    for (const m of CATALOGUE_SEED.methods) {
      expect(m.label).toBe(en.crops.method[m.key]);
      expect(m.short).toBe(en.crops.methodShort[m.key]);
      expect([m.material_title, m.material_body]).toEqual(
        steps.material[m.key]
          ? [steps.material[m.key].title, steps.material[m.key].body]
          : [null, null],
      );
    }
  });
});
