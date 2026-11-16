import { seededCatalogue } from '../../catalogue/testing';
import { cropTitle, defaultTitle, flowerCareTitle } from './task-titles';

const catalogue = seededCatalogue();
const en = (
  key: Parameters<typeof cropTitle>[0]['key'],
  crop: string,
  step?: string,
) => cropTitle({ key, crop, step }, catalogue, 'en');
const hi = (
  key: Parameters<typeof cropTitle>[0]['key'],
  crop: string,
  step?: string,
) => cropTitle({ key, crop, step }, catalogue, 'hi');

describe('reminder titles', () => {
  it('writes the English titles exactly as before', () => {
    expect(en('seeds', 'tomato')).toBe('Get tomato seeds');
    expect(en('seeds.material', 'potato')).toBe('Get seed potatoes for potato');
    expect(en('sow.plant', 'potato')).toBe('Plant potato');
    expect(en('sow.nursery', 'tomato')).toBe('Sow tomato in a nursery tray');
    expect(en('sow.bed', 'palak')).toBe('Sow spinach in the bed');
    expect(en('sprout.nursery', 'tomato')).toBe(
      'Check the tomato seedlings have come up',
    );
    expect(en('sprout.plant', 'potato')).toBe(
      'Check the planted potato for shoots',
    );
    expect(en('sprout.sown', 'palak')).toBe(
      'Check the sown spinach for sprouts',
    );
    expect(en('transplant', 'tomato')).toBe(
      'Transplant the tomato seedlings to the bed',
    );
    expect(en('thin', 'carrot')).toBe('Thin the carrot seedlings');
    expect(en('ready.bloom', 'marigold')).toBe(
      'The marigold should start blooming soon',
    );
    expect(en('ready.pick', 'tomato')).toBe(
      'The tomato should be ready to pick soon',
    );
    expect(en('succession', 'palak')).toBe('Sow another row of spinach');
    expect(en('care', 'tomato', 'stake')).toBe('Stake the tomato plants');
  });

  it('writes Hindi titles with the Hindi crop name', () => {
    expect(hi('sow.nursery', 'tomato')).toBe(
      'टमाटर के बीज नर्सरी ट्रे में बोएं',
    );
    expect(hi('care', 'tomato', 'stake')).toBe(
      'टमाटर के पौधों को डंडी से सहारा दें',
    );
    expect(hi('seeds.material', 'potato')).toMatch(/^आलू के लिए .+ ले आएं$/);
    for (const key of [
      'seeds',
      'sow.plant',
      'sow.bed',
      'sprout.nursery',
      'sprout.plant',
      'sprout.sown',
      'transplant',
      'thin',
      'ready.bloom',
      'ready.pick',
      'succession',
    ] as const)
      expect(hi(key, 'palak')).toMatch(/पालक/);
  });

  it('gives no title for a crop or step it does not know', () => {
    expect(
      cropTitle({ key: 'thin', crop: 'no_such_crop' }, catalogue, 'hi'),
    ).toBeNull();
    expect(
      cropTitle(
        { key: 'care', crop: 'tomato', step: 'no_such_step' },
        catalogue,
        'hi',
      ),
    ).toBeNull();
  });

  it('names perennial flower care in Hindi from its source key', () => {
    expect(flowerCareTitle('rose:prune:2026-10', catalogue)).toMatch(/गुलाब/);
    expect(flowerCareTitle('rose:no_such:2026-10', catalogue)).toBeNull();
    expect(flowerCareTitle('garbage', catalogue)).toBeNull();
  });

  it('has Hindi for the default titles', () => {
    expect(defaultTitle('WATER', 'en')).toBe('Water the plant');
    expect(defaultTitle('WATER', 'hi')).toBe('पौधे को पानी दें');
  });
});
