import type { Catalogue } from '../../catalogue';

/** What a plant record says about its kind; any of it may be missing. */
export interface TreeIdentityInput {
  name?: string | null;
  /** FLOWER records are matched against perennial flowers, never the fruit types. */
  record_kind?: string | null;
  species?: string | null;
  variety?: string | null;
}

/**
 * Names a plant's species family from what the gardener typed, against one
 * loaded catalogue. Cheap and synchronous: take one per request or job.
 */
export class SpeciesResolver {
  constructor(readonly catalogue: Catalogue) {}

  family(input: TreeIdentityInput): string {
    if (input.record_kind === 'FLOWER')
      return (
        firstOf(input, (text) => this.catalogue.flowerFamilyIn(text)) ??
        'generic_flower'
      );
    return this.match(input)?.family ?? 'generic_perennial';
  }

  /** How the family was found: a matched word, or a fallback. */
  classificationBasis(input: TreeIdentityInput): string {
    if (this.family(input) === 'generic_perennial')
      return 'species_text_fallback';
    const match = this.match(input);
    return match ? `normalized_alias:${match.alias}` : 'species_text_fallback';
  }

  private match(input: TreeIdentityInput) {
    return firstOf(input, (text) => this.catalogue.fruitFamilyIn(latin(text)));
  }
}

/**
 * What the gardener said the plant is (species, variety) before what they
 * call it: in "Champa's rose" with species "Rose", the nickname must not win.
 */
function firstOf<T>(
  input: TreeIdentityInput,
  find: (text: string) => T | null,
): T | null {
  const kind = [input.species, input.variety].filter(Boolean).join(' ');
  return (kind && find(kind)) || (input.name ? find(input.name) : null);
}

/** Lower-case Latin letters and digits only, single-spaced. */
const latin = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
