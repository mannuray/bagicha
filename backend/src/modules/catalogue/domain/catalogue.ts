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
import { FORMER_DISPLAY_NAMES } from './former-names';
import { hasWords, hindiWords, latinWords } from './words';
import { careForTree, type TreeWords } from './care-kind';
import type { FamilyCare } from './tree-care';

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
      /** Each fruit type's Hindi names (its plain add-tree entry's), NFC. */
      fruitHindi: Map<string, string[]>;
      flowers: Map<string, PerennialFlower>;
      /** Hindi add-tree names of served fruit entries and flowers, by English display name. */
      hindiNames: Map<string, { family: string; hi: string }>;
      /** Served flower aliases, longest first ("china rose" before "rose"). */
      flowerAliases: Array<{ alias: string; family: string }>;
      search: SearchEntry[];
      /** Approved tree care by family (retired care sends trees back to the season pack). */
      treeCare: Map<string, FamilyCare>;
      /** APPROVED fruit types, perennial flowers and tree care: what the catalogue can offer. */
      approved: { fruitTypes: number; flowers: number; treeCare: number };
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
    const fruitHindi = new Map(
      seed.fruitPlants
        .filter((p) => served(p) && p.key === p.species_family)
        .map((p) => [p.key, (p.languages?.hi ?? []).map((n) => hindiWords(n))]),
    );
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
    const servedEntries = [
      ...seed.fruitPlants.filter(served),
      ...seed.perennialFlowers.filter(served).map(flowerSearchEntry),
    ];
    const byKey = new Map(seed.fruitPlants.map((p) => [p.key, p]));
    const hindiNames = new Map(
      [
        ...servedEntries.map((e) => [e.display_name, e] as const),
        // A tree saved under an entry's old name keeps its Hindi name.
        ...Object.entries(FORMER_DISPLAY_NAMES).flatMap(([old, key]) => {
          const e = byKey.get(key);
          return e && served(e) ? [[old, e] as const] : [];
        }),
      ].flatMap(([name, e]) =>
        e.hi?.display_name
          ? [
              [
                name,
                { family: e.species_family, hi: e.hi.display_name },
              ] as const,
            ]
          : [],
      ),
    );
    const treeCare = new Map(
      seed.treeCare
        .filter(approved)
        .map(({ status: _s, notes: _n, ...care }) => [care.family, care]),
    );
    return new Catalogue(version, {
      listed,
      crops,
      methods,
      careSteps,
      fruitTypes,
      fruitHindi,
      flowers,
      flowerAliases,
      hindiNames,
      search,
      treeCare,
      approved: {
        fruitTypes: seed.fruitTypes.filter(approved).length,
        flowers: seed.perennialFlowers.filter(approved).length,
        treeCare: treeCare.size,
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

  /**
   * The first fruit type, in seed order, one of whose words appears whole in
   * this text: its English-letter words, or its Hindi names ("अमरूद").
   */
  fruitFamilyIn(text: string): { family: string; alias: string } | null {
    const latin = latinWords(text);
    const hindi = hindiWords(text);
    for (const type of this.parts.fruitTypes) {
      const alias =
        type.match_aliases.find((a) => hasWords(latin, a)) ??
        this.parts.fruitHindi
          .get(type.key)
          ?.find((n) => n && hasWords(hindi, n));
      if (alias) return { family: type.key, alias };
    }
    return null;
  }

  /** A fruit family's approved care; null when it has none (it keeps the season pack). */
  treeCare(family: string | null | undefined): FamilyCare | null {
    return (family && this.parts.treeCare.get(family)) || null;
  }

  /**
   * The care this tree gets: its family's care, or for a family split by kind
   * (citrus) the care of the kind its variety, species or name names. Null
   * when there is none: the tree keeps the season pack.
   */
  treeCareFor(
    family: string | null | undefined,
    tree: TreeWords,
  ): FamilyCare | null {
    const care = this.treeCare(family);
    return care && careForTree(care, tree);
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
  approvedCounts(): { fruitTypes: number; flowers: number; treeCare: number } {
    return this.parts.approved;
  }

  /** What add-tree search ranks: APPROVED entries, by weight, then name. */
  /**
   * A plant's Hindi name while it still carries its catalogue name (the crop's
   * name, or an add-tree entry's of the same family); null once renamed or
   * when no Hindi is written.
   */
  hindiPlantName(plant: {
    name: string;
    crop_id: string | null;
    species_family: string | null;
  }): string | null {
    const crop = this.crop(plant.crop_id);
    if (crop) return crop.name === plant.name ? (crop.hi?.name ?? null) : null;
    const entry = this.parts.hindiNames.get(plant.name);
    return entry && entry.family === plant.species_family ? entry.hi : null;
  }

  searchEntries(): SearchEntry[] {
    return this.parts.search;
  }
}

const served = (r: { status: CatalogueStatus }) => r.status !== 'DRAFT';
const approved = (r: { status: CatalogueStatus }) => r.status === 'APPROVED';

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
    ...(f.hi?.name ? { hi: { display_name: f.hi.name } } : {}),
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
