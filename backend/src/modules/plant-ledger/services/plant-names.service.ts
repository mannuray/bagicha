import { Injectable } from '@nestjs/common';
import type { Lang } from '../../../common/http/lang';
import { CatalogueStore } from '../../catalogue';
import {
  cropTitle,
  defaultTitle,
  flowerCareTitle,
  type CropTitleRef,
} from '../domain/task-titles';

/** What naming a plant needs from it. */
export interface NamedPlant {
  name: string;
  crop_id?: string | null;
  species_family?: string | null;
}

export type PlantNamer = (plant: NamedPlant) => string;

/** What titling a reminder needs from it. */
export interface TitledTask {
  type: string;
  title: string | null;
  source: string;
  source_key?: string | null;
  metadata?: unknown;
}

export type TaskTitler = (task: TitledTask) => string;

/** The saved title (or the type's default): what English requests use. */
export const savedTitle: TaskTitler = (task) =>
  task.title ?? defaultTitle(task.type, 'en');

/** The crop sentence a crop reminder saved, if it has one. */
function sentenceOf(metadata: unknown): CropTitleRef | null {
  const title =
    metadata && typeof metadata === 'object'
      ? (metadata as { title?: unknown }).title
      : null;
  return title &&
    typeof title === 'object' &&
    typeof (title as CropTitleRef).key === 'string' &&
    typeof (title as CropTitleRef).crop === 'string'
    ? (title as CropTitleRef)
    : null;
}

/** The saved name: what English requests (and code that never shows names) use. */
export const savedName: PlantNamer = (plant) => plant.name;

/**
 * How plants are named in a response: the saved name, or in Hindi the
 * catalogue's Hindi name while the plant keeps its catalogue name.
 */
@Injectable()
export class PlantNamesService {
  constructor(private readonly catalogue: CatalogueStore) {}

  /** One namer per request, over one catalogue snapshot. */
  async namer(lang: Lang): Promise<PlantNamer> {
    if (lang !== 'hi') return savedName;
    const catalogue = await this.catalogue.snapshot();
    return (plant) =>
      catalogue.hindiPlantName({
        name: plant.name,
        crop_id: plant.crop_id ?? null,
        species_family: plant.species_family ?? null,
      }) ?? plant.name;
  }

  /**
   * How reminders are titled in a response: as saved, or in Hindi where the
   * sentence is known (crop reminders that saved theirs, perennial flower
   * care, untitled ones). Tree care and typed reminders stay as saved.
   */
  async titler(lang: Lang): Promise<TaskTitler> {
    if (lang !== 'hi') return savedTitle;
    const catalogue = await this.catalogue.snapshot();
    return (task) => {
      if (task.title === null) return defaultTitle(task.type, 'hi');
      const sentence =
        task.source === 'CROP_PLAN' ? sentenceOf(task.metadata) : null;
      const hindi = sentence
        ? cropTitle(sentence, catalogue, 'hi')
        : task.source === 'FLOWER_CARE' && task.source_key
          ? flowerCareTitle(task.source_key, catalogue)
          : null;
      return hindi ?? task.title;
    };
  }
}
