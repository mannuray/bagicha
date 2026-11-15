import { AppError } from '../../../common/errors';
import type {
  CareStepInfo,
  CatalogueSeed,
  CatalogueStatus,
  CropInfo,
  CropSeed,
  FruitTypeInfo,
  LifeProfile,
  PerennialFlower,
  PerennialFlowerSeed,
  PlantingMethod,
  SearchEntry,
} from './types';

/** Vegetables ready in fewer days than this are tagged `quick`. */
const QUICK_DAYS = 45;
/** Flowers that keep blooming at least this long are tagged `long`. */
const LONG_BLOOM_DAYS = 60;

/** A crop names a method the catalogue doesn't have: the push validates this, so it's a bug. */
export class UnknownMethodError extends AppError {
  readonly httpStatus = 500;
  readonly kind = 'programmer' as const;

  constructor(key: string) {
    super('CATALOGUE_UNKNOWN_METHOD', 'Unknown planting method', { key });
  }
}

/**
 * One loaded catalogue, read-only. Lists hold APPROVED records only; lookups
 * by id also find RETIRED ones, so a garden that already grows a retired crop
 * keeps its journey. DRAFT records are found by nothing.
 */
export class Catalogue {
  private constructor(
    readonly version: number,
    private readonly parts: {
      listed: CropInfo[];
      crops: Map<string, CropInfo>;
      methods: Map<string, PlantingMethod>;
      careSteps: Map<string, CareStepInfo>;
      /** Served fruit types in seed order: the first whose words match wins. */
      fruitTypes: FruitTypeInfo[];
      flowers: Map<string, PerennialFlower>;
      /** Served flower aliases, longest first ("china rose" before "rose"). */
      flowerAliases: Array<{ alias: string; family: string }>;
      search: SearchEntry[];
      /** APPROVED fruit types and perennial flowers: what the catalogue can offer. */
      approved: { fruitTypes: number; flowers: number };
    },
  ) {}

  static from(seed: CatalogueSeed, version: number): Catalogue {
    const visible = seed.crops.filter(served);
    const crops = new Map(visible.map((c) => [c.id, toCropInfo(c)]));
    const listed = visible
      .filter((c) => c.status === 'APPROVED')
      .map((c) => crops.get(c.id) as CropInfo);
    const methods = new Map(
      seed.methods
        .filter(served)
        .map(({ status: _status, ...m }) => [m.key, m]),
    );
    const careSteps = new Map(
      seed.careSteps
        .filter(served)
        .map(({ status: _status, ...s }) => [s.key, s]),
    );
    const fruitTypes = seed.fruitTypes
      .filter(served)
      .map(({ status: _s, notes: _n, ...t }) => t);
    const servedFlowers = seed.perennialFlowers.filter(served);
    const flowers = new Map(
      servedFlowers.map((f) => [f.family, toPerennialFlower(f)]),
    );
    const flowerAliases = servedFlowers
      .flatMap((f) =>
        f.aliases.map((alias) => ({
          alias: alias.normalize('NFC'),
          family: f.family,
        })),
      )
      .sort((a, b) => b.alias.length - a.alias.length);
    // A retired fruit type takes its entries out of search; trees already grown keep it.
    const listedTypes = new Set(
      seed.fruitTypes.filter(approved).map((t) => t.key),
    );
    const search = [
      ...seed.fruitPlants
        .filter((p) => approved(p) && listedTypes.has(p.species_family))
        .map(({ status: _s, notes: _n, ...p }) => p),
      ...seed.perennialFlowers.filter(approved).map(flowerSearchEntry),
    ].sort(
      (a, b) =>
        b.confidence_weight - a.confidence_weight ||
        a.display_name.localeCompare(b.display_name, 'en'),
    );
    return new Catalogue(version, {
      listed,
      crops,
      methods,
      careSteps,
      fruitTypes,
      flowers,
      flowerAliases,
      search,
      approved: {
        fruitTypes: seed.fruitTypes.filter(approved).length,
        flowers: seed.perennialFlowers.filter(approved).length,
      },
    });
  }

  crop(id: string | null | undefined): CropInfo | null {
    return (id && this.parts.crops.get(id)) || null;
  }

  /** An APPROVED crop: what can be newly added or shown in lists. */
  listedCrop(id: string): CropInfo | null {
    const crop = this.crop(id);
    return crop && this.parts.listed.includes(crop) ? crop : null;
  }

  /** APPROVED crops and flowers, in catalogue order. */
  listedCrops(): CropInfo[] {
    return this.parts.listed;
  }

  method(key: string): PlantingMethod {
    const method = this.parts.methods.get(key);
    if (!method) throw new UnknownMethodError(key);
    return method;
  }

  careStep(key: string): CareStepInfo | null {
    return this.parts.careSteps.get(key) ?? null;
  }

  fruitType(key: string | null | undefined): FruitTypeInfo | null {
    return this.parts.fruitTypes.find((t) => t.key === key) ?? null;
  }

  /** The first fruit type, in seed order, one of whose words appears whole in this lower-case text. */
  fruitFamilyIn(haystack: string): { family: string; alias: string } | null {
    for (const type of this.parts.fruitTypes) {
      const alias = type.match_aliases.find((a) => hasWords(haystack, a));
      if (alias) return { family: type.key, alias };
    }
    return null;
  }

  perennialFlower(family: string | null | undefined): PerennialFlower | null {
    return (family && this.parts.flowers.get(family)) || null;
  }

  /** The perennial flower named in this text, or null. */
  flowerFamilyIn(text: string): string | null {
    // NFC, so ड़ typed as one code point or as ड + nukta reads the same.
    const haystack = text
      .normalize('NFC')
      .toLowerCase()
      .replace(/[^\p{L}\p{M}0-9]+/gu, ' ');
    return (
      this.parts.flowerAliases.find(({ alias }) => hasWords(haystack, alias))
        ?.family ?? null
    );
  }

  /** How long a family usually takes to fruit or bloom, stays productive and lives; null when unknown. */
  lifeProfile(family: string | null | undefined): LifeProfile | null {
    const fruit = this.fruitType(family);
    if (fruit) return fruit.life;
    const flower = this.perennialFlower(family);
    if (!flower) return null;
    return {
      first_fruit_months: flower.first_bloom_months,
      productive_until_months: flower.lifespan_months,
      lifespan_months: flower.lifespan_months,
      note_key: flower.note_key,
    };
  }

  /** How many APPROVED fruit types and perennial flowers the catalogue offers. */
  approvedCounts(): { fruitTypes: number; flowers: number } {
    return this.parts.approved;
  }

  /** What add-tree search ranks: APPROVED entries, by weight, then name. */
  searchEntries(): SearchEntry[] {
    return this.parts.search;
  }
}

const served = (r: { status: CatalogueStatus }) => r.status !== 'DRAFT';
const approved = (r: { status: CatalogueStatus }) => r.status === 'APPROVED';

/** Whole words only: "ber" must not match inside "mulberry". */
const hasWords = (haystack: string, alias: string) =>
  ` ${haystack.trim()} `.includes(` ${alias} `);

const DEVANAGARI = /[\u0900-\u097F]/;

function toPerennialFlower({
  status: _status,
  notes: _notes,
  ...flower
}: PerennialFlowerSeed): PerennialFlower {
  return flower;
}

/** A perennial flower as an add-tree search entry: Latin names as aliases, Devanagari as Hindi. */
function flowerSearchEntry(f: PerennialFlowerSeed): SearchEntry {
  return {
    key: f.family,
    species_family: f.family,
    species: f.family,
    variety: null,
    display_name: f.name.charAt(0).toUpperCase() + f.name.slice(1),
    plant_type: 'perennial_flower',
    aliases: f.aliases.filter((a) => !DEVANAGARI.test(a)),
    languages: { hi: f.aliases.filter((a) => DEVANAGARI.test(a)) },
    regions: [],
    confidence_weight: 0.85,
  };
}

function toCropInfo({
  status: _status,
  notes: _notes,
  ...crop
}: CropSeed): CropInfo {
  const derived =
    crop.kind === 'CROP'
      ? crop.days_to_first_harvest[0] < QUICK_DAYS && 'quick'
      : crop.harvest_span_days >= LONG_BLOOM_DAYS && 'long';
  return { ...crop, tags: derived ? [...crop.tags, derived] : [...crop.tags] };
}
