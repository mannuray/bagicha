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
 * word decides, and within it the earliest word wins. Place and variety
 * names count only in the variety and species; a word for a different
 * plant ("kaffir lime") that comes first makes its field pick no kind.
 * The kind's care comes back under the family key `family:kind`, so its
 * task keys never meet another kind's. Null when no kind fits: the tree
 * keeps the season pack.
 */
export function careForTree(
  care: FamilyCare,
  tree: TreeWords,
): FamilyCare | null {
  if (!care.kinds) return care;
  const fields: Array<[string | null | undefined, boolean]> = [
    [tree.variety, true],
    [tree.species, true],
    [tree.name, false],
  ];
  for (const [field, withVarietyWords] of fields) {
    const kind = field ? earliestKind(care, field, withVarietyWords) : null;
    if (kind === BLOCKED) return null;
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

/** A field naming a different plant ("kaffir lime") decides: no kind. */
const BLOCKED = 'blocked' as const;

function earliestKind(
  care: FamilyCare,
  text: string,
  withVarietyWords: boolean,
): CareKind | typeof BLOCKED | null {
  // One haystack for both scripts, so positions compare: letters of any
  // script, lower-case, NFC (ड़ typed either way reads the same).
  const haystack = hindiWords(text);
  const found = [
    ...(care.noKindWords ?? []).map((word) => ({
      kind: BLOCKED as CareKind | typeof BLOCKED,
      word,
    })),
    ...(care.kinds ?? []).flatMap((kind) =>
      [
        ...kind.words,
        ...(withVarietyWords ? (kind.varietyWords ?? []) : []),
      ].map((word) => ({ kind, word })),
    ),
  ]
    .map(({ kind, word }) => ({ kind, at: wordAt(haystack, hindiWords(word)) }))
    .filter((f) => f.at >= 0)
    .sort((a, b) => a.at - b.at);
  return found[0]?.kind ?? null;
}
