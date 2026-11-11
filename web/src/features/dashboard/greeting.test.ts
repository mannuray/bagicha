import { describe, expect, it } from 'vitest';
import { greetingFor } from './greeting';

describe('greetingFor', () => {
  it('morning until noon, afternoon until 5 pm, then evening', () => {
    expect(greetingFor(0)).toBe('morning');
    expect(greetingFor(11)).toBe('morning');
    expect(greetingFor(12)).toBe('afternoon');
    expect(greetingFor(16)).toBe('afternoon');
    expect(greetingFor(17)).toBe('evening');
    expect(greetingFor(23)).toBe('evening');
  });
});
