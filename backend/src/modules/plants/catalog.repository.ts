import { Injectable } from '@nestjs/common';
import { PlantCatalogEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The shared plant catalogue (not user-owned). */
@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActive(): Promise<PlantCatalogEntry[]> {
    return this.prisma.plantCatalogEntry.findMany({
      where: { active: true },
      orderBy: [{ confidence_weight: 'desc' }, { display_name: 'asc' }],
    });
  }

  /**
   * Adds each entry, or refreshes the one with the same family, species and
   * variety (no unique key on those columns; variety can be null). Runs on every
   * boot, so it reads the catalogue once and writes only what changed.
   */
  async upsertAll(
    data: Prisma.PlantCatalogEntryCreateManyInput[],
  ): Promise<void> {
    const stored = await this.prisma.plantCatalogEntry.findMany();
    const byKey = new Map(stored.map((row) => [catalogKey(row), row]));
    for (const entry of data) {
      const existing = byKey.get(catalogKey(entry));
      if (!existing) {
        await this.prisma.plantCatalogEntry.create({ data: entry });
      } else if (!sameFields(existing, entry)) {
        await this.prisma.plantCatalogEntry.update({
          where: { id: existing.id },
          data: entry,
        });
      }
    }
  }
}

type CatalogIdentity = Pick<
  Prisma.PlantCatalogEntryCreateManyInput,
  'species_family' | 'species' | 'variety'
>;

const catalogKey = (e: CatalogIdentity) =>
  JSON.stringify([e.species_family, e.species, e.variety ?? null]);

/** True when every field the seed sets already has that value. */
function sameFields(
  row: object,
  entry: Prisma.PlantCatalogEntryCreateManyInput,
): boolean {
  const stored = row as Record<string, unknown>;
  return Object.entries(entry).every(([key, value]) => {
    const want = value === Prisma.JsonNull ? null : value;
    return stableJson(stored[key] ?? null) === stableJson(want ?? null);
  });
}

/** JSON with object keys sorted: Postgres jsonb doesn't keep insertion order. */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        )
      : v,
  );
}
