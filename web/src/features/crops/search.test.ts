import { describe, expect, it } from 'vitest';
import { matchesSearch } from './names';

const cauliflower = { name: 'Cauliflower', aliases: ['phool gobhi', 'gobhi', 'फूलगोभी'] };
const cabbage = { name: 'Cabbage', aliases: ['patta gobhi', 'bandh gobhi', 'पत्तागोभी'] };
const tomato = { name: 'Tomato', aliases: ['tamatar', 'टमाटर'] };
const potato = { name: 'Potato', aliases: ['aloo', 'आलू'] };
const garlic = { name: 'Garlic', aliases: ['lehsun', 'लहसुन'] };
const peas = { name: 'Peas', aliases: ['matar', 'मटर'] };
const coriander = { name: 'Coriander (Dhaniya)', aliases: ['dhaniya', 'cilantro', 'धनिया'] };

describe('crop search: English, Hindi and the ways people spell them', () => {
  it('matches names and aliases, Hindi script included', () => {
    expect(matchesSearch(cauliflower, 'cauli')).toBe(true);
    expect(matchesSearch(cauliflower, 'गोभी')).toBe(true);
    expect(matchesSearch(cauliflower, '')).toBe(true);
  });

  it('forgives Hinglish spelling swaps', () => {
    expect(matchesSearch(cauliflower, 'govi')).toBe(true);
    expect(matchesSearch(cauliflower, 'gobi')).toBe(true);
    expect(matchesSearch(cauliflower, 'phul gobi')).toBe(true);
    expect(matchesSearch(cabbage, 'patta govi')).toBe(true);
    expect(matchesSearch(garlic, 'lasun')).toBe(true);
    expect(matchesSearch(tomato, 'tamater')).toBe(true);
    expect(matchesSearch(coriander, 'dhania')).toBe(true);
  });

  it('forgives a one-letter typo in a longer word', () => {
    expect(matchesSearch(cauliflower, 'califlower')).toBe(true);
    expect(matchesSearch(cauliflower, 'cauliflowr')).toBe(true);
    expect(matchesSearch(coriander, 'corriander')).toBe(true);
  });

  it('does not mix up different crops', () => {
    expect(matchesSearch(potato, 'tomato')).toBe(false);
    expect(matchesSearch(tomato, 'potato')).toBe(false);
    expect(matchesSearch(peas, 'pumpkin')).toBe(false);
    expect(matchesSearch(cabbage, 'carrot')).toBe(false);
    expect(matchesSearch(peas, 'pa')).toBe(false);
    expect(matchesSearch(tomato, 'matar')).toBe(false);
    expect(matchesSearch(coriander, 'kheera')).toBe(false);
  });
});
