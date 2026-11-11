import { z } from 'zod';

/**
 * Every journal entry type, exactly the backend's LogType enum (a test reads the
 * Prisma schema to keep the two equal). Everything else uses these, never strings.
 */
export const LOG_TYPES = [
  'PLANTING', 'PHOTO', 'NOTE', 'WATERING', 'WATERING_STRESS', 'PRUNING', 'FEEDING',
  'FLOWERING', 'FLOWER_DROP', 'FRUIT_SET', 'FRUIT_DROP', 'HARVEST', 'PEST_DIAGNOSIS',
  'TREATMENT', 'DIAGNOSIS', 'WEATHER_DAMAGE',
  'SOWING', 'TRANSPLANTING', 'GERMINATION', 'THINNING', 'BOLTING',
  'PINCHING', 'DEADHEADING', 'BLOOM_PEAK',
  'SEASON_END', 'PLANT_ENDED',
] as const;
export const logTypeSchema = z.enum(LOG_TYPES);
export type LogType = z.infer<typeof logTypeSchema>;

/** What "Log a moment" offers for a tree or crop. */
export const TREE_LOGGABLE: readonly LogType[] = ['NOTE', 'WATERING', 'FLOWERING', 'FRUIT_SET', 'FLOWER_DROP', 'FRUIT_DROP', 'HARVEST', 'PRUNING', 'FEEDING', 'TREATMENT', 'PHOTO'];
/** Flowers log blooms and bloom care, never fruit. */
export const FLOWER_LOGGABLE: readonly LogType[] = ['FLOWERING', 'BLOOM_PEAK', 'DEADHEADING', 'PINCHING', 'PRUNING', 'FEEDING', 'WATERING', 'TREATMENT', 'NOTE', 'PHOTO'];

/** Drops carry a severity. */
export const DROP_TYPES: ReadonlySet<LogType> = new Set(['FLOWER_DROP', 'FRUIT_DROP']);
/** A flower's blooms (bloom years). */
export const BLOOM_TYPES: readonly LogType[] = ['FLOWERING', 'BLOOM_PEAK'];

export const DROP_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const HARVEST_UNITS = ['kg', 'pieces', 'crates'] as const;
export const HARVEST_QUALITIES = ['poor', 'fair', 'good', 'excellent'] as const;
