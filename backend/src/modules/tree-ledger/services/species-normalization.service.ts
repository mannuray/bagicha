import { Injectable } from '@nestjs/common';

interface TreeIdentityInput {
  name?: string | null;
  species?: string | null;
  variety?: string | null;
}

@Injectable()
export class SpeciesNormalizationService {
  private readonly familyAliases: Record<string, string[]> = {
    mango: [
      'mango',
      'malda',
      'langra',
      'dussehri',
      'dashehari',
      'alphonso',
      'chausa',
      'himsagar',
      'banganapalli',
      'totapuri',
      'kesar',
      'amrapali',
      'fazli',
    ],
    citrus: [
      'citrus',
      'lemon',
      'lime',
      'orange',
      'mosambi',
      'mausambi',
      'sweet lime',
      'kinnow',
      'mandarin',
    ],
    litchi: ['litchi', 'lychee', 'shahi', 'china', 'rose scented'],
    guava: ['guava', 'allahabad safeda', 'lalit', 'lucknow 49'],
    pomegranate: ['pomegranate', 'anar', 'bhagawa'],
    banana: ['banana', 'plantain', 'grand naine', 'g9', 'robusta'],
  };

  resolveSpeciesFamily(input: TreeIdentityInput): string {
    const haystack = this.buildHaystack(input);

    for (const [family, aliases] of Object.entries(this.familyAliases)) {
      if (aliases.some((alias) => haystack.includes(alias))) {
        return family;
      }
    }

    return 'generic_perennial';
  }

  buildClassificationBasis(input: TreeIdentityInput): string {
    const family = this.resolveSpeciesFamily(input);
    const matchedAlias = this.findMatchedAlias(input);
    if (family === 'generic_perennial' || !matchedAlias) {
      return 'species_text_fallback';
    }

    return `normalized_alias:${matchedAlias}`;
  }

  private findMatchedAlias(input: TreeIdentityInput): string | null {
    const haystack = this.buildHaystack(input);

    for (const aliases of Object.values(this.familyAliases)) {
      const matched = aliases.find((alias) => haystack.includes(alias));
      if (matched) {
        return matched;
      }
    }

    return null;
  }

  private buildHaystack(input: TreeIdentityInput): string {
    return [input.name, input.species, input.variety]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
