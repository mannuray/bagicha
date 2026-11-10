import { Injectable, OnModuleInit } from '@nestjs/common';
import { PlantCatalogEntry, Prisma } from '@prisma/client';
import { Page, PageQuery, toPage } from '../../common/pagination';
import { CatalogRepository } from './catalog.repository';

type ResolveConfidence = 'high' | 'medium' | 'low';

interface PlantSeed {
  species_family: string;
  species: string;
  variety?: string;
  display_name: string;
  plant_type: string;
  aliases: string[];
  languages?: Record<string, string[]>;
  regions?: string[];
  confidence_weight?: number;
}

@Injectable()
export class PlantsService implements OnModuleInit {
  constructor(private readonly catalog: CatalogRepository) {}

  async onModuleInit() {
    await this.bootstrapCatalog();
  }

  async search(
    rawQuery: string,
    q: PageQuery,
  ): Promise<Page<ReturnType<PlantsService['toSearchItem']>>> {
    const query = this.normalize(rawQuery);
    if (!query) return toPage([], 0, q);

    const ranked = this.rankEntries(await this.catalog.listActive(), query);
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

    const entries = await this.catalog.listActive();
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
      {
        species_family: 'mango',
        species: 'mango',
        display_name: 'Mango',
        plant_type: 'fruit_tree',
        aliases: ['mango', 'aam', 'mango plant', 'aam ka ped'],
        languages: { hi: ['आम', 'आम का पेड़'] },
        regions: ['north_india', 'east_india', 'west_india'],
        confidence_weight: 0.9,
      },
      {
        species_family: 'mango',
        species: 'mango',
        variety: 'malda',
        display_name: 'Malda Mango',
        plant_type: 'fruit_tree',
        aliases: ['malda', 'maldah', 'malda aam', 'malda mango'],
        languages: { hi: ['मालदा', 'मालदा आम'] },
        regions: ['east_india', 'north_india'],
        confidence_weight: 0.98,
      },
      {
        species_family: 'mango',
        species: 'mango',
        variety: 'langra',
        display_name: 'Langra Mango',
        plant_type: 'fruit_tree',
        aliases: ['langra', 'langra aam', 'langda'],
        languages: { hi: ['लंगड़ा', 'लंगड़ा आम'] },
        regions: ['north_india', 'east_india'],
        confidence_weight: 0.95,
      },
      {
        species_family: 'mango',
        species: 'mango',
        variety: 'amrapali',
        display_name: 'Amrapali Mango',
        plant_type: 'fruit_tree',
        aliases: ['amrapali', 'amrapali aam'],
        languages: { hi: ['अम्रपाली', 'अम्रपाली आम'] },
        regions: ['north_india', 'east_india'],
        confidence_weight: 0.93,
      },
      {
        species_family: 'citrus',
        species: 'lemon',
        display_name: 'Lemon',
        plant_type: 'fruit_tree',
        aliases: ['lemon', 'nimbu', 'lemon plant'],
        languages: { hi: ['नींबू', 'निंबू'] },
        regions: ['north_india', 'east_india', 'west_india', 'south_deccan'],
        confidence_weight: 0.92,
      },
      {
        species_family: 'citrus',
        species: 'orange',
        variety: 'kinnow',
        display_name: 'Kinnow',
        plant_type: 'fruit_tree',
        aliases: ['kinnow', 'kinnu'],
        languages: { hi: ['किन्नू'] },
        regions: ['north_india'],
        confidence_weight: 0.9,
      },
      {
        species_family: 'citrus',
        species: 'sweet_lime',
        variety: 'mosambi',
        display_name: 'Mosambi',
        plant_type: 'fruit_tree',
        aliases: ['mosambi', 'mausambi', 'sweet lime'],
        languages: { hi: ['मौसंबी'] },
        regions: ['west_india', 'north_india'],
        confidence_weight: 0.9,
      },
      {
        species_family: 'guava',
        species: 'guava',
        display_name: 'Guava',
        plant_type: 'fruit_tree',
        aliases: ['guava', 'amrood'],
        languages: { hi: ['अमरूद'] },
        regions: ['north_india', 'east_india', 'central_india'],
        confidence_weight: 0.9,
      },
      {
        species_family: 'litchi',
        species: 'litchi',
        display_name: 'Litchi',
        plant_type: 'fruit_tree',
        aliases: ['litchi', 'lychee'],
        languages: { hi: ['लीची'] },
        regions: ['east_india', 'north_india'],
        confidence_weight: 0.9,
      },
      {
        species_family: 'pomegranate',
        species: 'pomegranate',
        display_name: 'Pomegranate',
        plant_type: 'fruit_tree',
        aliases: ['pomegranate', 'anar'],
        languages: { hi: ['अनार'] },
        regions: ['north_india', 'west_india'],
        confidence_weight: 0.88,
      },
      {
        species_family: 'banana',
        species: 'banana',
        display_name: 'Banana',
        plant_type: 'fruit_tree',
        aliases: ['banana', 'kela', 'plantain'],
        languages: { hi: ['केला'] },
        regions: ['east_india', 'south_deccan', 'coastal_humid'],
        confidence_weight: 0.88,
      },
      {
        species_family: 'papaya',
        species: 'papaya',
        display_name: 'Papaya',
        plant_type: 'fruit_tree',
        aliases: ['papaya', 'papita', 'red lady'],
        languages: { hi: ['पपीता'] },
        regions: [
          'east_india',
          'south_deccan',
          'coastal_humid',
          'west_india',
          'central_india',
        ],
        confidence_weight: 0.88,
      },
      {
        species_family: 'grape',
        species: 'grape',
        display_name: 'Grape',
        plant_type: 'fruit_tree',
        aliases: ['grape', 'grapes', 'angoor', 'angur', 'grape vine'],
        languages: { hi: ['अंगूर'] },
        regions: ['west_india', 'south_deccan', 'north_india'],
        confidence_weight: 0.86,
      },
      {
        species_family: 'jackfruit',
        species: 'jackfruit',
        display_name: 'Jackfruit',
        plant_type: 'fruit_tree',
        aliases: ['jackfruit', 'jack fruit', 'kathal'],
        languages: { hi: ['कटहल'] },
        regions: ['east_india', 'coastal_humid', 'south_deccan'],
        confidence_weight: 0.86,
      },
      {
        species_family: 'coconut',
        species: 'coconut',
        display_name: 'Coconut',
        plant_type: 'fruit_tree',
        aliases: ['coconut', 'nariyal', 'coconut palm'],
        languages: { hi: ['नारियल'] },
        regions: ['coastal_humid', 'south_deccan'],
        confidence_weight: 0.86,
      },
      {
        species_family: 'sapota',
        species: 'sapota',
        display_name: 'Sapota (Chikoo)',
        plant_type: 'fruit_tree',
        aliases: ['sapota', 'chikoo', 'chiku', 'sapodilla'],
        languages: { hi: ['चीकू'] },
        regions: ['west_india', 'south_deccan', 'coastal_humid'],
        confidence_weight: 0.86,
      },
      {
        species_family: 'amla',
        species: 'amla',
        display_name: 'Amla',
        plant_type: 'fruit_tree',
        aliases: ['amla', 'aonla', 'indian gooseberry'],
        languages: { hi: ['आंवला', 'आँवला'] },
        regions: ['north_india', 'central_india', 'east_india'],
        confidence_weight: 0.86,
      },
      {
        species_family: 'custard_apple',
        species: 'custard apple',
        display_name: 'Custard apple (Sitaphal)',
        plant_type: 'fruit_tree',
        aliases: ['custard apple', 'sitaphal', 'sharifa', 'sugar apple'],
        languages: { hi: ['सीताफल', 'शरीफा'] },
        regions: ['central_india', 'west_india', 'south_deccan'],
        confidence_weight: 0.85,
      },
      {
        species_family: 'moringa',
        species: 'moringa',
        display_name: 'Moringa (Drumstick)',
        plant_type: 'fruit_tree',
        aliases: ['moringa', 'drumstick', 'sahjan', 'sehjan', 'munga'],
        languages: { hi: ['सहजन', 'मुनगा'] },
        regions: ['south_deccan', 'east_india', 'central_india', 'west_india'],
        confidence_weight: 0.85,
      },
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
      Array.isArray(entry.languages) ||
      !language
    ) {
      return [];
    }

    const value = (entry.languages as Record<string, unknown>)[language];
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

  private normalize(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }
}
