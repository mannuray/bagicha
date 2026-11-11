import type { PlantDetail } from '../plants';

export type HeroPhoto = { kind: 'own'; url: string } | { kind: 'stock' } | { kind: 'none' };

/**
 * The hero image: the plant's own latest photo; the stock tree only for a tree with
 * no photo (or whose photo failed) — never while its own photo is still loading.
 */
export function heroPhoto(
  plant: Pick<PlantDetail, 'record_kind' | 'crop_id'>,
  photo: { url: string | null | undefined; key: string | null; failed: boolean },
): HeroPhoto {
  if (photo.url) return { kind: 'own', url: photo.url };
  // Only a recorded tree (not a journey crop) gets the stock mango.
  const tree = plant.record_kind === 'TREE' && !plant.crop_id;
  return tree && (!photo.key || photo.failed) ? { kind: 'stock' } : { kind: 'none' };
}

/** The date a plant's age is counted to: now, or its end for an ended plant. */
export function ageUntil(plant: Pick<PlantDetail, 'ended_at'>, now: Date): Date {
  return plant.ended_at ? new Date(plant.ended_at) : now;
}
