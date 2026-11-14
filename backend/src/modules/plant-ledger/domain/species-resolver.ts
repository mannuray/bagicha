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
      return this.catalogue.flowerFamilyIn(words(input)) ?? 'generic_flower';
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
    return this.catalogue.fruitFamilyIn(haystack(input));
  }
}

const words = (input: TreeIdentityInput) =>
  [input.name, input.species, input.variety].filter(Boolean).join(' ');

/** Lower-case Latin letters and digits only, single-spaced. */
const haystack = (input: TreeIdentityInput) =>
  words(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
