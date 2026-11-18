import type { CareKind, FamilyCare } from './tree-care';
import { hindiWords, wordAt } from './words';

/** What a tree record says about itself; any of it may be missing. */
export interface TreeWords {
  variety?: string | null;
  species?: string | null;
  name?: string | null;
}

/**
 * The care this tree gets from its family's care. A family without kinds
 * applies as it is. With kinds, the tree's fields are read one at a time
 * (variety, then species, then name): the first field holding any kind's
 * word decides, and within it the earliest word wins. The kind's care comes
 * back under the family key `family:kind`, so its task keys never meet
 * another kind's. Null when no kind fits: the tree keeps the season pack.
 */
export function careForTree(
  care: FamilyCare,
  tree: TreeWords,
): FamilyCare | null {
  if (!care.kinds) return care;
  for (const field of [tree.variety, tree.species, tree.name]) {
    const kind = field ? earliestKind(care.kinds, field) : null;
    if (kind)
      return {
        family: `${care.family}:${kind.key}`,
        sources: care.sources,
        grownIn: kind.grownIn,
        regions: kind.regions,
        ...(kind.pendingRegions && { pendingRegions: kind.pendingRegions }),
      };
  }
  return null;
}

function earliestKind(kinds: CareKind[], text: string): CareKind | null {
  // One haystack for both scripts, so positions compare: letters of any
  // script, lower-case, NFC (ड़ typed either way reads the same).
  const haystack = hindiWords(text);
  let best: { kind: CareKind; at: number } | null = null;
  for (const kind of kinds)
    for (const word of kind.words) {
      const at = wordAt(haystack, hindiWords(word));
      if (at >= 0 && (!best || at < best.at)) best = { kind, at };
    }
  return best?.kind ?? null;
}
