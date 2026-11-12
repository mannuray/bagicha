import { Injectable, OnModuleInit } from '@nestjs/common';
import { PlantCatalogEntry, Prisma } from '@prisma/client';
import { Page, PageQuery, toPage } from '../../common/pagination';
import { Clock } from '../../common/time';
import { PERENNIAL_FLOWERS } from '../plant-ledger';
import { CatalogRepository } from './catalog.repository';
import { FRUIT_CATALOGUE, type PlantSeed } from './domain/fruit-catalogue';

type ResolveConfidence = 'high' | 'medium' | 'low';

/** The catalogue changes only at boot; a manual edit shows up within this long. */
const CATALOGUE_CACHE_MS = 10 * 60_000;

@Injectable()
export class PlantsService implements OnModuleInit {
  private cached: { at: number; entries: PlantCatalogEntry[] } | null = null;

  constructor(
    private readonly catalog: CatalogRepository,
    private readonly clock: Clock,
  ) {}

  async onModuleInit() {
    await this.bootstrapCatalog();
    this.cached = null;
  }

  /** Every search keystroke ranks the whole catalogue: read it once, not per request. */
  private async activeEntries(): Promise<PlantCatalogEntry[]> {
    const now = this.clock.now().getTime();
    if (!this.cached || now - this.cached.at > CATALOGUE_CACHE_MS) {
      this.cached = { at: now, entries: await this.catalog.listActive() };
    }
    return this.cached.entries;
  }

  async search(
    rawQuery: string,
    q: PageQuery,
  ): Promise<Page<ReturnType<PlantsService['toSearchItem']>>> {
    const query = this.normalize(rawQuery);
    if (!query) return toPage([], 0, q);

    const ranked = this.rankEntries(await this.activeEntries(), query);
    const start = (q.page - 1) * q.page_size;
    return toPage(
      ranked
        .slice(start, start + q.page_size)
        .map(({ entry }) => this.toSearchItem(entry)),
      ranked.length,
      q,
    );
  }

  async resolve(rawQuery: string, regionCluster?: string, language?: string) {
    const query = this.normalize(rawQuery);
    if (!query) {
      return {
        match: null,
        confidence: 'low',
        matched_alias: null,
        alternatives: [],
      };
    }

    const entries = await this.activeEntries();
    const ranked = this.rankEntries(entries, query, regionCluster, language);
    const [best, ...rest] = ranked;

    if (!best || best.score < 0.45) {
      return {
        match: null,
        confidence: 'low' as ResolveConfidence,
        matched_alias: null,
        alternatives: rest
          .slice(0, 3)
          .map(({ entry }) => this.toSearchItem(entry)),
      };
    }

    return {
      match: {
        ...this.toSearchItem(best.entry),
        matched_alias: best.matchedAlias,
      },
      confidence: this.scoreToConfidence(best.score),
      matched_alias: best.matchedAlias,
      alternatives: rest
        .slice(0, 3)
        .map(({ entry }) => this.toSearchItem(entry)),
    };
  }

  private async bootstrapCatalog() {
    // Safe to run on every boot: adds missing entries and refreshes existing ones.
    const seeds: PlantSeed[] = [
      ...FRUIT_CATALOGUE,
      // Perennial flowers (flowers spec §2.2): one entry per family in flower-care.ts.
      ...PERENNIAL_FLOWERS.map(
        (f): PlantSeed => ({
          species_family: f.family,
          species: f.family,
          display_name: f.name.charAt(0).toUpperCase() + f.name.slice(1),
          plant_type: 'perennial_flower',
          aliases: f.aliases.filter((a) => !/[\u0900-\u097F]/.test(a)),
          languages: { hi: f.aliases.filter((a) => /[\u0900-\u097F]/.test(a)) },
          confidence_weight: 0.85,
        }),
      ),
    ];

    await this.catalog.upsertAll(
      seeds.map((seed) => ({
        ...seed,
        variety: seed.variety ?? null,
        languages: seed.languages
          ? (seed.languages as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        regions: seed.regions ?? [],
        confidence_weight: seed.confidence_weight ?? 0.5,
      })),
    );
  }

  private rankEntries(
    entries: PlantCatalogEntry[],
    query: string,
    regionCluster?: string,
    language?: string,
  ) {
    const normalizedRegion = this.normalize(regionCluster || '');
    const normalizedLanguage = this.normalize(language || '');

    return entries
      .map((entry) => {
        const scored = this.scoreEntry(
          entry,
          query,
          normalizedRegion,
          normalizedLanguage,
        );
        return scored ? { entry, ...scored } : null;
      })
      .filter(
        (
          item,
        ): item is {
          entry: PlantCatalogEntry;
          score: number;
          matchedAlias: string | null;
        } => !!item,
      )
      .sort((left, right) => right.score - left.score);
  }

  private scoreEntry(
    entry: PlantCatalogEntry,
    query: string,
    regionCluster: string,
    language: string,
  ): { score: number; matchedAlias: string | null } | null {
    const displayName = this.normalize(entry.display_name);
    const aliases = entry.aliases.map((alias) => this.normalize(alias));
    const languageAliases = this.languageAliases(entry, language);
    const allAliases = [...aliases, ...languageAliases];

    let score = 0;
    let matchedAlias: string | null = null;

    if (displayName === query) {
      score = 1.0;
      matchedAlias = entry.display_name;
    } else {
      const exactAlias = allAliases.find((alias) => alias === query);
      if (exactAlias) {
        score = 0.96;
        matchedAlias = exactAlias;
      } else if (displayName.includes(query) || query.includes(displayName)) {
        score = 0.82;
      } else {
        const partialAlias = allAliases.find(
          (alias) => alias.includes(query) || query.includes(alias),
        );
        if (partialAlias) {
          score = 0.76;
          matchedAlias = partialAlias;
        } else {
          const fuzzy = allAliases
            .map((alias) => this.tokenOverlap(alias, query))
            .sort((a, b) => b - a)[0];

          if (fuzzy >= 0.45) {
            score = 0.45 + fuzzy * 0.4;
          }
        }
      }
    }

    if (score <= 0) {
      return null;
    }

    if (
      regionCluster &&
      entry.regions.some((region) => this.normalize(region) === regionCluster)
    ) {
      score += 0.04;
    }

    score += Math.min(entry.confidence_weight, 1) * 0.02;

    return {
      score: Math.min(score, 1),
      matchedAlias,
    };
  }

  private tokenOverlap(left: string, right: string): number {
    const leftTokens = new Set(left.split(' ').filter(Boolean));
    const rightTokens = new Set(right.split(' ').filter(Boolean));
    if (leftTokens.size === 0 || rightTokens.size === 0) {
      return 0;
    }

    const intersection = [...leftTokens].filter((token) =>
      rightTokens.has(token),
    ).length;
    return intersection / Math.max(leftTokens.size, rightTokens.size);
  }

  private languageAliases(
    entry: PlantCatalogEntry,
    language: string,
  ): string[] {
    if (
      !entry.languages ||
      typeof entry.languages !== 'object' ||
      Array.isArray(entry.languages)
    ) {
      return [];
    }

    // No language asked for: names in every language count ("आम" finds mango).
    const byLanguage = entry.languages as Record<string, unknown>;
    const value = language
      ? byLanguage[language]
      : Object.values(byLanguage).flat();
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => this.normalize(item));
  }

  toSearchItem(entry: PlantCatalogEntry) {
    return {
      id: entry.id,
      display_name: entry.display_name,
      species_family: entry.species_family,
      species: entry.species,
      variety: entry.variety,
      plant_type: entry.plant_type,
    };
  }

  private scoreToConfidence(score: number): ResolveConfidence {
    if (score >= 0.9) return 'high';
    if (score >= 0.65) return 'medium';
    return 'low';
  }

  /** Lower-case words, keeping letters in any script (Hindi names must survive). */
  private normalize(value: string) {
    return value
      .normalize('NFC')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
