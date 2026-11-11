import { describe, expect, it } from 'vitest';
import { blankMoment, toMoment } from './moment';

describe('toMoment: the draft as the entry we send', () => {
  it('a bare note is just its type and trimmed text', () => {
    expect(toMoment({ ...blankMoment(), content: '  New leaves ' }, null)).toEqual({ type: 'NOTE', content: 'New leaves' });
  });

  it('adds the photo key, drop severity and harvest details only where they apply', () => {
    expect(toMoment({ ...blankMoment(), type: 'FRUIT_DROP', severity: 'HIGH' }, 'journal/u1/a.jpg')).toEqual({
      type: 'FRUIT_DROP', metadata: { photo_key: 'journal/u1/a.jpg', severity: 'HIGH' },
    });
    expect(toMoment({ ...blankMoment(), type: 'NOTE', severity: 'HIGH' }, null)).toEqual({ type: 'NOTE' });
    expect(toMoment({ ...blankMoment(), type: 'HARVEST', quantity: '3', unit: 'kg', quality: 'good' }, null)).toEqual({
      type: 'HARVEST', metadata: { quantity_value: 3, quantity_unit: 'kg', quality: 'good' },
    });
  });

  it('a picked day becomes its noon in India', () => {
    expect(toMoment({ ...blankMoment(), date: '2026-03-10' }, null).event_at).toBe('2026-03-10T06:30:00.000Z');
  });
});
