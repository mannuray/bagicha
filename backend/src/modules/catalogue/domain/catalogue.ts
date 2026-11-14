import { AppError } from '../../../common/errors';
import type {
  CareStepInfo,
  CatalogueSeed,
  CropInfo,
  CropSeed,
  PlantingMethod,
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
    private readonly listed: CropInfo[],
    private readonly crops: Map<string, CropInfo>,
    private readonly methods: Map<string, PlantingMethod>,
    private readonly careSteps: Map<string, CareStepInfo>,
  ) {}

  static from(seed: CatalogueSeed, version: number): Catalogue {
    const visible = seed.crops.filter((c) => c.status !== 'DRAFT');
    const crops = new Map(visible.map((c) => [c.id, toCropInfo(c)]));
    const listed = visible
      .filter((c) => c.status === 'APPROVED')
      .map((c) => crops.get(c.id) as CropInfo);
    const methods = new Map(
      seed.methods
        .filter((m) => m.status !== 'DRAFT')
        .map(({ status: _status, ...m }) => [m.key, m]),
    );
    const careSteps = new Map(
      seed.careSteps
        .filter((s) => s.status !== 'DRAFT')
        .map(({ status: _status, ...s }) => [s.key, s]),
    );
    return new Catalogue(version, listed, crops, methods, careSteps);
  }

  crop(id: string | null | undefined): CropInfo | null {
    return (id && this.crops.get(id)) || null;
  }

  /** An APPROVED crop: what can be newly added or shown in lists. */
  listedCrop(id: string): CropInfo | null {
    const crop = this.crop(id);
    return crop && this.listed.includes(crop) ? crop : null;
  }

  /** APPROVED crops and flowers, in catalogue order. */
  listedCrops(): CropInfo[] {
    return this.listed;
  }

  method(key: string): PlantingMethod {
    const method = this.methods.get(key);
    if (!method) throw new UnknownMethodError(key);
    return method;
  }

  careStep(key: string): CareStepInfo | null {
    return this.careSteps.get(key) ?? null;
  }
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
