import type { Plant, Prisma, TaskCategory, TaskType } from '@prisma/client';
import type { AdviceRef } from '../../catalogue';
import type { TaskDraft } from '../../plant-ledger';
import { weatherAdviceKeys } from './weather-advice';
import type { WeatherEvent, WeatherEventKind } from './weather-events';

export type ReminderPlant = Pick<
  Plant,
  'id' | 'record_kind' | 'lifecycle_stage' | 'crop_stage'
>;

const TASK: Record<
  WeatherEventKind,
  { type: TaskType; category: TaskCategory; slot: 'max' | 'mm' | 'min' }
> = {
  HEAT: { type: 'WATER', category: 'WATERING', slot: 'max' },
  HEAVY_RAIN: { type: 'INSPECT', category: 'INSPECTION', slot: 'mm' },
  COLD_NIGHT: { type: 'INSPECT', category: 'INSPECTION', slot: 'min' },
};

/** A crop that is planned or resting has nothing in the ground to look after. */
const growing = (p: ReminderPlant) =>
  p.record_kind !== 'CROP' ||
  (p.crop_stage !== 'PLANNED' && p.crop_stage !== 'RESTING');

/** Cold nights threaten seedlings and young plants (source check): young trees, vegetables, flowers. */
const tender = (p: ReminderPlant) =>
  p.record_kind === 'TREE'
    ? p.lifecycle_stage === 'SAPLING' || p.lifecycle_stage === 'JUVENILE'
    : true;

const getsReminder = (kind: WeatherEventKind, p: ReminderPlant) =>
  growing(p) && (kind !== 'COLD_NIGHT' || tender(p));

/** Midnight IST at the start of a YYYY-MM-DD date. */
export const istDayStart = (date: string) => new Date(`${date}T00:00:00+05:30`);

/**
 * One reminder per plant per event. The key holds the date of the weather, so
 * a heat day seen on the day before and again on the day itself is one
 * reminder; once done or skipped it stays done (WEATHER is a one-off source).
 * Titles are saved in English with their advice keys, as personal adjustments
 * are, so a Hindi request reads them in Hindi.
 */
export function reminderDrafts(
  events: readonly WeatherEvent[],
  plants: readonly ReminderPlant[],
  en: (ref: AdviceRef) => string,
): Array<{ plantId: string; draft: TaskDraft }> {
  return events.flatMap((event) => {
    const task = TASK[event.kind];
    const keys = weatherAdviceKeys(event.kind);
    const title: AdviceRef = { key: keys.title };
    const reason: AdviceRef = {
      key: keys.reason,
      params: { [task.slot]: Math.round(event.value) },
    };
    return plants
      .filter((p) => getsReminder(event.kind, p))
      .map((p) => ({
        plantId: p.id,
        draft: {
          type: task.type,
          category: task.category,
          priority: 'HIGH',
          source: 'WEATHER',
          sourceKey: `weather:${event.kind}:${p.id}:${event.date}`,
          dueDate: istDayStart(event.date),
          title: en(title),
          reason: en(reason),
          // AdviceRef is JSON-safe; Prisma's JSON type can't see that through the interface.
          metadata: {
            advice: { title, reason, summary: { key: keys.tip } },
            weather: { kind: event.kind, date: event.date, value: event.value },
          } as unknown as Prisma.InputJsonValue,
        } satisfies TaskDraft,
      }));
  });
}
