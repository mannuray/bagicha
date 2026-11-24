import { describe, expect, it } from 'vitest';
import i18n from '../../../lib/i18n';
import { phaseLabel } from './format';

const hi = i18n.getFixedT('hi');
const en = i18n.getFixedT('en');

describe('phaseLabel', () => {
  it('names a known phase in Hindi', () => {
    expect(phaseLabel(hi, 'flowering')).toBe('फूल आने का समय');
  });

  it('adds the dryness suffix in Hindi', () => {
    expect(phaseLabel(hi, 'flowering_with_dryness_attention')).toBe(
      'फूल आने का समय, पानी की कमी पर ध्यान',
    );
    expect(phaseLabel(hi, 'dryness_attention')).toBe('पानी की कमी पर ध्यान');
  });

  it('humanises an unknown key, in either language', () => {
    expect(phaseLabel(hi, 'some_new_phase')).toBe('some new phase');
    expect(phaseLabel(en, 'fruit_development')).toBe('fruit development');
  });
});
