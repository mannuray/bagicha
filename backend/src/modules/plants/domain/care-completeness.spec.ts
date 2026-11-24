import { RegionCluster } from '@prisma/client';
import { CARE_PENDING, CATALOGUE_SEED, careForTree } from '../../catalogue';
import type {
  FamilyCare,
  RegionCare,
  TreeCareItem as CareItem,
} from '../../catalogue';

const FRUIT_CATALOGUE = CATALOGUE_SEED.fruitPlants;
/** Approved care by family, as the catalogue serves it. */
const TREE_CARE: Record<string, FamilyCare> = Object.fromEntries(
  CATALOGUE_SEED.treeCare
    .filter((c) => c.status === 'APPROVED')
    .map((c) => [c.family, c]),
);

const families = [...new Set(FRUIT_CATALOGUE.map((s) => s.species_family))];
const regionCares = (care: FamilyCare): RegionCare[] =>
  Object.values(care.regions).filter(
    (r): r is RegionCare => !!r && 'items' in r,
  );
/** A family's care, or each of its kinds' care (as the engine gets it). */
const cares = (care: FamilyCare): FamilyCare[] =>
  care.kinds
    ? care.kinds.map((k) => careForTree(care, { variety: k.words[0] })!)
    : [care];
const allItems = (care: FamilyCare): CareItem[] =>
  cares(care).flatMap((c) => regionCares(c).flatMap((r) => r.items));
/** The care a tree added from this entry gets: its kind's for a family with kinds. */
const careForEntry = (
  care: FamilyCare,
  e: (typeof FRUIT_CATALOGUE)[number],
): FamilyCare | null =>
  careForTree(care, {
    variety: e.variety,
    species: e.species,
    name: e.display_name,
  });

describe('tree care completeness (the add-plant playbook)', () => {
  it('every catalogue tree family has care data or is pending', () => {
    const missing = families.filter(
      (f) => !TREE_CARE[f] && !CARE_PENDING.includes(f),
    );
    expect(missing).toEqual([]);
  });

  it('care exists for every region the catalogue grows each entry in', () => {
    const gaps: string[] = [];
    for (const [family, familyCare] of Object.entries(TREE_CARE)) {
      for (const e of FRUIT_CATALOGUE.filter(
        (p) => p.species_family === family && p.status === 'APPROVED',
      )) {
        // An entry of no kind keeps the season pack on purpose (citrus.seed.spec pins which).
        const care = careForEntry(familyCare, e);
        if (!care) continue;
        for (const region of e.regions.map(
          (r) => r.toUpperCase() as RegionCluster,
        )) {
          if (!care.grownIn.includes(region))
            gaps.push(`${care.family}: grownIn lacks ${region} (${e.key})`);
          if (care.pendingRegions?.includes(region)) continue;
          const entry = care.regions[region];
          const target =
            entry && 'sameAs' in entry ? care.regions[entry.sameAs] : entry;
          if (!target || !('items' in target))
            gaps.push(`${care.family}: no care for ${region}`);
        }
      }
    }
    expect(gaps).toEqual([]);
  });

  it('a pending region has no care written for it', () => {
    const both = Object.values(TREE_CARE)
      .flatMap(cares)
      .flatMap((care) =>
        (care.pendingRegions ?? [])
          .filter((r) => care.regions[r])
          .map((r) => `${care.family}: ${r}`),
      );
    expect(both).toEqual([]);
  });

  it('no family is both pending and done', () => {
    expect(CARE_PENDING.filter((f) => TREE_CARE[f])).toEqual([]);
  });

  it('no window ends on Feb 28, so a leap day is never uncovered', () => {
    const feb28: string[] = [];
    const check = (label: string, when: { kind: string; to?: number[] }) => {
      if (when.kind === 'CALENDAR' && when.to?.[0] === 2 && when.to[1] === 28)
        feb28.push(label);
    };
    for (const care of Object.values(TREE_CARE))
      for (const c of cares(care))
        for (const [region, entry] of Object.entries(c.regions))
          if (entry && 'items' in entry) {
            for (const i of entry.items)
              check(`${c.family} ${region} ${i.key}`, i.when);
            for (const p of entry.phases)
              check(`${c.family} ${region} phase ${p.phase}`, p.when);
          }
    expect(feb28).toEqual([]);
  });

  it('titles are at most 60 characters; every chemical spray mentions gloves and waiting days', () => {
    const problems: string[] = [];
    for (const care of Object.values(TREE_CARE)) {
      for (const item of allItems(care)) {
        if (item.title.length > 60)
          problems.push(`${care.family}.${item.key}: title too long`);
        if (item.chemical && !/gloves/i.test(item.chemical))
          problems.push(`${care.family}.${item.key}: chemical lacks gloves`);
        // Sprays carry a waiting period before picking; fertiliser doesn't.
        if (
          item.category === 'PROTECTION' &&
          item.chemical &&
          !/days/i.test(item.chemical)
        )
          problems.push(`${care.family}.${item.key}: spray lacks waiting days`);
      }
    }
    expect(problems).toEqual([]);
  });
});
