import { describe, expect, it } from 'vitest';
import { sowNowNames } from './names';

const c = (name: string, kind = 'CROP', status = 'open') => ({ name, kind, status });

describe('sowNowNames: the chooser\'s "good to sow now" line', () => {
  it('the first three vegetables open now, by short name', () => {
    expect(sowNowNames([c('Lady finger (Bhindi)'), c('Marigold', 'FLOWER'), c('Spinach', 'CROP', 'soon'), c('Radish'), c('Tomato'), c('Bean')])).toEqual([
      'Bhindi',
      'Radish',
      'Tomato',
    ]);
  });
});
