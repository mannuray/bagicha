import { Injectable } from '@nestjs/common';
import { ValidationError } from '../../../common/errors';
import {
  CatalogueRepository,
  type CatalogueWrite,
} from '../catalogue.repository';
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
  fruitTypes: ItemOutcome[];
  fruitPlants: ItemOutcome[];
  perennialFlowers: ItemOutcome[];
  treeCare: ItemOutcome[];
  seasonGuide: ItemOutcome[];
  advice: ItemOutcome[];
}

type Kind = Exclude<keyof PushReport, 'version'>;

/** How each kind of record is keyed; the ordered kinds keep their place in the seed. */
const KINDS: Record<
  Kind,
  { keyOf: (record: never) => string; ordered: boolean }
> = {
  crops: { keyOf: (c: { id: string }) => c.id, ordered: true },
  methods: { keyOf: (m: { key: string }) => m.key, ordered: false },
  careSteps: { keyOf: (s: { key: string }) => s.key, ordered: false },
  fruitTypes: { keyOf: (t: { key: string }) => t.key, ordered: true },
  fruitPlants: { keyOf: (p: { key: string }) => p.key, ordered: true },
  perennialFlowers: {
    keyOf: (f: { family: string }) => f.family,
    ordered: true,
  },
  treeCare: { keyOf: (c: { family: string }) => c.family, ordered: false },
  seasonGuide: { keyOf: (g: { region: string }) => g.region, ordered: false },
  advice: { keyOf: (a: { key: string }) => a.key, ordered: false },
};
const KIND_NAMES = Object.keys(KINDS) as Kind[];

/**
 * Writes the repo's seed files to the catalogue tables: adds new records,
 * updates changed ones, never deletes. A record the database has but the seed
 * lacks stops the push with nothing written, so a broken file can't hide
 * records; retiring is done by setting RETIRED in the seed. Idempotent.
 */
@Injectable()
export class CataloguePushService {
  constructor(private readonly repo: CatalogueRepository) {}

  async push(input: unknown): Promise<PushReport> {
    const seed = validateSeed(input);
    const stored = await this.repo.loadSeed(['DRAFT', 'APPROVED', 'RETIRED']);
    const keys = (kind: Kind, records: object[]) =>
      records.map((r) => KINDS[kind].keyOf(r as never));

    const missing = Object.fromEntries(
      KIND_NAMES.map((kind) => [
        kind,
        lacking(keys(kind, stored[kind]), keys(kind, seed[kind])),
      ]),
    ) as Record<Kind, string[]>;
    if (KIND_NAMES.some((kind) => missing[kind].length > 0))
      throw new ValidationError(
        'CATALOGUE_MISSING_FROM_SEED',
        'The seed is missing records the database has',
        missing,
      );

    // A record's place in the list is part of it: moving it counts as a change.
    const place = (kind: Kind, records: object[]) =>
      KINDS[kind].ordered
        ? records.map((r, sort_order) => ({ ...r, sort_order }))
        : records;
    const report = {} as Omit<PushReport, 'version'>;
    const write = {} as Record<Kind, object[]>;
    for (const kind of KIND_NAMES) {
      const next = place(kind, seed[kind]);
      const outcomes = compare(next, place(kind, stored[kind]), (r) =>
        KINDS[kind].keyOf(r as never),
      );
      report[kind] = outcomes;
      write[kind] = next.filter((_, i) => outcomes[i].outcome !== 'unchanged');
    }
    const changes = KIND_NAMES.reduce((n, kind) => n + write[kind].length, 0);
    const version =
      changes > 0
        ? await this.repo.applyPush(write as unknown as CatalogueWrite)
        : await this.repo.version();
    return { version, ...report };
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
