import { Injectable } from '@nestjs/common';
import { ValidationError } from '../../../common/errors';
import { CatalogueRepository } from '../catalogue.repository';
import { validateSeed } from '../domain/schemas';

export type PushOutcome = 'added' | 'changed' | 'unchanged';

export interface ItemOutcome {
  key: string;
  outcome: PushOutcome;
}

export interface PushReport {
  version: number;
  crops: ItemOutcome[];
  methods: ItemOutcome[];
  careSteps: ItemOutcome[];
}

/**
 * Writes the repo's seed files to the catalogue tables: adds new records,
 * updates changed ones, never deletes. A record the database has but the seed
 * lacks stops the push with nothing written, so a broken file can't hide
 * crops; retiring is done by setting RETIRED in the seed. Idempotent.
 */
@Injectable()
export class CataloguePushService {
  constructor(private readonly repo: CatalogueRepository) {}

  async push(input: unknown): Promise<PushReport> {
    const seed = validateSeed(input);
    const stored = await this.repo.loadSeed(['DRAFT', 'APPROVED', 'RETIRED']);

    const missing = {
      crops: lacking(
        stored.crops.map((c) => c.id),
        seed.crops.map((c) => c.id),
      ),
      methods: lacking(
        stored.methods.map((m) => m.key),
        seed.methods.map((m) => m.key),
      ),
      careSteps: lacking(
        stored.careSteps.map((s) => s.key),
        seed.careSteps.map((s) => s.key),
      ),
    };
    if (
      missing.crops.length + missing.methods.length + missing.careSteps.length >
      0
    )
      throw new ValidationError(
        'CATALOGUE_MISSING_FROM_SEED',
        'The seed is missing records the database has',
        missing,
      );

    // A crop's place in the list is part of it: moving it counts as a change.
    const orderedSeed = seed.crops.map((c, sort_order) => ({
      ...c,
      sort_order,
    }));
    const orderedStored = stored.crops.map((c, sort_order) => ({
      ...c,
      sort_order,
    }));
    const crops = compare(orderedSeed, orderedStored, (c) => c.id);
    const methods = compare(seed.methods, stored.methods, (m) => m.key);
    const careSteps = compare(seed.careSteps, stored.careSteps, (s) => s.key);

    const write = {
      crops: orderedSeed.filter((_, i) => crops[i].outcome !== 'unchanged'),
      methods: seed.methods.filter(
        (_, i) => methods[i].outcome !== 'unchanged',
      ),
      careSteps: seed.careSteps.filter(
        (_, i) => careSteps[i].outcome !== 'unchanged',
      ),
    };
    const changes =
      write.crops.length + write.methods.length + write.careSteps.length;
    const version =
      changes > 0
        ? await this.repo.applyPush(write)
        : await this.repo.version();
    return { version, crops, methods, careSteps };
  }
}

const lacking = (stored: string[], seed: string[]) => {
  const inSeed = new Set(seed);
  return stored.filter((key) => !inSeed.has(key));
};

function compare<T>(
  seed: T[],
  stored: T[],
  keyOf: (r: T) => string,
): ItemOutcome[] {
  const byKey = new Map(stored.map((r) => [keyOf(r), r]));
  return seed.map((record) => {
    const key = keyOf(record);
    const before = byKey.get(key);
    const outcome: PushOutcome = !before
      ? 'added'
      : stableJson(before) === stableJson(record)
        ? 'unchanged'
        : 'changed';
    return { key, outcome };
  });
}

/** JSON with object keys sorted: Postgres jsonb doesn't keep insertion order. */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        )
      : v,
  );
}
