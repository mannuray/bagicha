import { PlantingDatePrecision } from '@prisma/client';
import { Clock } from '../../../common/time';

export interface ParsedPlantingDate {
  date: Date | null;
  precision: PlantingDatePrecision;
  input: string | null;
}

export function parsePlantingDate(
  input: string | null | undefined,
  requestedPrecision: PlantingDatePrecision | null | undefined,
  clock: Clock,
): ParsedPlantingDate {
  if (input === null || input === undefined || input.trim() === '') {
    return {
      date: null,
      precision: PlantingDatePrecision.UNKNOWN,
      input: input === undefined ? null : input,
    };
  }

  const normalized = input.trim();
  const precision =
    requestedPrecision ?? inferPlantingDatePrecision(normalized);

  if (precision === PlantingDatePrecision.YEAR) {
    const year = Number(normalized);
    if (
      !Number.isInteger(year) ||
      year < 1900 ||
      year > clock.now().getFullYear() + 1
    ) {
      return {
        date: null,
        precision: PlantingDatePrecision.UNKNOWN,
        input: normalized,
      };
    }
    return {
      date: new Date(Date.UTC(year, 0, 1)),
      precision,
      input: normalized,
    };
  }

  if (precision === PlantingDatePrecision.MONTH_YEAR) {
    const match = normalized.match(/^(\d{4})-(\d{1,2})$/);
    if (!match) {
      return {
        date: null,
        precision: PlantingDatePrecision.UNKNOWN,
        input: normalized,
      };
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) {
      return {
        date: null,
        precision: PlantingDatePrecision.UNKNOWN,
        input: normalized,
      };
    }

    return {
      date: new Date(Date.UTC(year, month - 1, 1)),
      precision,
      input: normalized,
    };
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return {
      date: null,
      precision: PlantingDatePrecision.UNKNOWN,
      input: normalized,
    };
  }

  return {
    date: parsed,
    precision: PlantingDatePrecision.EXACT_DATE,
    input: normalized,
  };
}

export function inferPlantingDatePrecision(
  input: string,
): PlantingDatePrecision {
  if (/^\d{4}$/.test(input)) {
    return PlantingDatePrecision.YEAR;
  }

  if (/^\d{4}-\d{1,2}$/.test(input)) {
    return PlantingDatePrecision.MONTH_YEAR;
  }

  return PlantingDatePrecision.EXACT_DATE;
}
