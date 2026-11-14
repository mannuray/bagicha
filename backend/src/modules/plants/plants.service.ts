import { Injectable } from '@nestjs/common';
import { Page, PageQuery, toPage } from '../../common/pagination';
import { CatalogueStore, type SearchEntry } from '../catalogue';

type ResolveConfidence = 'high' | 'medium' | 'low';

/** Add-tree search and name resolution over the plant catalogue's search entries. */
@Injectable()
export class PlantsService {
  constructor(private readonly catalogue: CatalogueStore) {}

  /** Every keystroke ranks the whole list; it is held in memory with the catalogue. */
  private async activeEntries(): Promise<SearchEntry[]> {
    return (await this.catalogue.snapshot()).searchEntries();
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

  private rankEntries(
    entries: SearchEntry[],
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
          entry: SearchEntry;
          score: number;
          matchedAlias: string | null;
        } => !!item,
      )
      .sort((left, right) => right.score - left.score);
  }

  private scoreEntry(
    entry: SearchEntry,
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

  private languageAliases(entry: SearchEntry, language: string): string[] {
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

  toSearchItem(entry: SearchEntry) {
    return {
      id: entry.key,
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
