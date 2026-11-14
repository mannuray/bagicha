/**
 * The plant catalogue's shapes. Records live in the database (filled by the
 * push from ../seed); the API serves them from an in-memory Catalogue.
 * Spec: docs/superpowers/specs/2026-11-14-catalogue-in-database-design.md.
 */

export type ClimateGroup = 'PLAINS' | 'PENINSULAR' | 'HILLS';

/** The journey shapes the code knows; a planting method names one. */
export type Journey = 'NURSERY' | 'DIRECT' | 'PLANT';

/** Only APPROVED is listed; lookups by id also find RETIRED; DRAFT is hidden. */
export type CatalogueStatus = 'DRAFT' | 'APPROVED' | 'RETIRED';

export type Months = [number, number];

export interface CareStep {
  key: string;
  after: 'SOWING' | 'TRANSPLANTING';
  days: number;
}

export type CropTag = 'container' | 'beginner' | 'quick' | 'long';

export interface CropInfo {
  id: string;
  /** Vegetables are CROP; seasonal flowers are FLOWER. */
  kind: 'CROP' | 'FLOWER';
  name: string;
  aliases: string[];
  family: string;
  /** A planting method key (catalogue_methods). */
  method: string;
  /** Sowing windows per climate group as [startMonth, endMonth]; may wrap the year end. */
  windows: Record<ClimateGroup, Months[]>;
  germination_days: [number, number];
  transplant_after_days: [number, number] | null;
  /** From sowing (or planting the tuber, clove, rhizome, corm or bulb). For flowers: to first bloom. */
  days_to_first_harvest: [number, number];
  /** Where a climate group ripens much earlier or later (e.g. chana: Punjab vs Tamil Nadu). */
  harvest_by_group?: Partial<Record<ClimateGroup, [number, number]>>;
  harvest_span_days: number;
  thin_after_days: number | null;
  succession_every_days: number | null;
  care: CareStep[];
  /** Derived: `quick` for fast vegetables, `long` for flowers that bloom 60+ days. */
  tags: CropTag[];
  guide: {
    plants_for_family_of_4: string;
    container: string;
    spacing_cm: [number, number];
  };
  scientific_name: string;
  /** One plain line about the crop, for its detail page. */
  description: string;
  /** FULL: 6+ hours of direct sun; PARTIAL: 3–5 hours is enough. */
  sun: 'FULL' | 'PARTIAL';
}

export interface PlantingMethod {
  key: string;
  journey: Journey;
  /** What to get before sowing ("seed potatoes"); null when it is seed. */
  material: string | null;
  /** Web: the method in a sentence ("Plant seed potatoes"). */
  label: string;
  /** Web: the method in a word ("tubers"). */
  short: string;
  /** Web: the material step on the crop page; null when it is seed. */
  material_title: string | null;
  material_body: string | null;
}

export interface CareStepInfo {
  key: string;
  /** Reminder title with a `{name}` slot: "Stake the {name} plants". */
  title: string;
  /** Web: the step on the crop page. */
  label_title: string;
  label_body: string;
}

/** A crop as written in the seed and stored: `quick` and `long` are never stored, they are derived. */
export type CropSeed = Omit<CropInfo, 'tags'> & {
  tags: Array<Exclude<CropTag, 'quick' | 'long'>>;
  status: CatalogueStatus;
  /** Source notes kept beside the values. */
  notes: string | null;
};

export type MethodSeed = PlantingMethod & { status: CatalogueStatus };
export type CareStepSeed = CareStepInfo & { status: CatalogueStatus };

export interface CatalogueSeed {
  crops: CropSeed[];
  methods: MethodSeed[];
  careSteps: CareStepSeed[];
}
