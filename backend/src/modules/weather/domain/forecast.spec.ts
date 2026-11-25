import { conditionFromWmo } from './forecast';

describe('conditionFromWmo', () => {
  it.each([
    [0, 'CLEAR'],
    [1, 'PARTLY_CLOUDY'],
    [2, 'PARTLY_CLOUDY'],
    [3, 'CLOUDY'],
    [45, 'FOG'],
    [48, 'FOG'],
    [51, 'DRIZZLE'],
    [57, 'DRIZZLE'],
    [61, 'RAIN'],
    [63, 'RAIN'],
    [80, 'RAIN'],
    [81, 'RAIN'],
    [65, 'HEAVY_RAIN'],
    [82, 'HEAVY_RAIN'],
    [71, 'SNOW'],
    [86, 'SNOW'],
    [95, 'THUNDERSTORM'],
    [99, 'THUNDERSTORM'],
  ] as const)('WMO %i is %s', (code, condition) => {
    expect(conditionFromWmo(code)).toBe(condition);
  });

  it('treats an unknown code as cloudy rather than failing the forecast', () => {
    expect(conditionFromWmo(42)).toBe('CLOUDY');
  });
});
