import { Injectable } from '@nestjs/common';
import { flowerFamilyIn } from '../domain/flower-care';

interface TreeIdentityInput {
  name?: string | null;
  /** FLOWER records are matched against perennial flowers, never the fruit families. */
  record_kind?: string | null;
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
      'hapus',
      'dasheri',
      'chaunsa',
      'mallika',
      'benishan',
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
      'kagzi',
      'gondhoraj',
      'galgal',
      'santra',
      'pomelo',
      'chakotra',
    ],
    litchi: ['litchi', 'lychee', 'shahi', 'china'],
    guava: ['guava', 'allahabad safeda', 'lalit', 'lucknow 49'],
    pomegranate: ['pomegranate', 'anar', 'bhagawa', 'bhagwa', 'kandhari'],
    banana: [
      'banana',
      'plantain',
      'grand naine',
      'g9',
      'robusta',
      'kela',
      'malbhog',
      'poovan',
      'nendran',
      'yelakki',
      'basrai',
    ],
    papaya: ['papaya', 'papita', 'red lady'],
    grape: ['grape', 'angoor', 'angur'],
    jackfruit: ['jackfruit', 'jack fruit', 'kathal'],
    coconut: ['coconut', 'nariyal'],
    sapota: ['sapota', 'chikoo', 'chiku', 'sapodilla', 'kalipatti'],
    amla: ['amla', 'aonla', 'indian gooseberry'],
    custard_apple: ['custard apple', 'sitaphal', 'sharifa', 'sugar apple'],
    moringa: ['moringa', 'drumstick', 'sahjan', 'sehjan', 'munga'],
  };

  resolveSpeciesFamily(input: TreeIdentityInput): string {
    if (input.record_kind === 'FLOWER') {
      const text = [input.name, input.species, input.variety]
        .filter(Boolean)
        .join(' ');
      return flowerFamilyIn(text) ?? 'generic_flower';
    }
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
