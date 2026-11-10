import { PlantingDatePrecision as P } from '@prisma/client';
import { FixedClock } from '../../../common/time';
import { parsePlantingDate } from './planting-date';

const clock = new FixedClock(new Date('2026-11-10T00:00:00Z'));

describe('parsePlantingDate', () => {
  it('treats empty input as unknown', () => {
    expect(parsePlantingDate('  ', undefined, clock)).toMatchObject({
      date: null,
      precision: P.UNKNOWN,
    });
  });

  it('parses a bare year', () => {
    expect(parsePlantingDate('2019', undefined, clock)).toMatchObject({
      date: new Date(Date.UTC(2019, 0, 1)),
      precision: P.YEAR,
    });
  });

  it('rejects years beyond next year, using the injected clock', () => {
    expect(parsePlantingDate('2028', undefined, clock).precision).toBe(
      P.UNKNOWN,
    );
    expect(parsePlantingDate('2027', undefined, clock).precision).toBe(P.YEAR);
  });

  it('parses month-year', () => {
    expect(parsePlantingDate('2020-07', undefined, clock)).toMatchObject({
      date: new Date(Date.UTC(2020, 6, 1)),
      precision: P.MONTH_YEAR,
    });
  });

  it('parses an exact date and rejects garbage', () => {
    expect(parsePlantingDate('2021-03-15', undefined, clock).precision).toBe(
      P.EXACT_DATE,
    );
    expect(parsePlantingDate('not a date', undefined, clock).precision).toBe(
      P.UNKNOWN,
    );
  });
});
