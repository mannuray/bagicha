import { RegionCluster } from '@prisma/client';
import { CARE_PENDING, TREE_CARE } from '../../plant-ledger';
import type { CareItem, FamilyCare, RegionCare } from '../../plant-ledger';
import { FRUIT_CATALOGUE } from './fruit-catalogue';

const families = [...new Set(FRUIT_CATALOGUE.map((s) => s.species_family))];
const grownByCatalogue = (family: string): RegionCluster[] => [
  ...new Set(
    FRUIT_CATALOGUE.filter((s) => s.species_family === family).flatMap((s) =>
      (s.regions ?? []).map((r) => r.toUpperCase() as RegionCluster),
    ),
  ),
];
const regionCares = (care: FamilyCare): RegionCare[] =>
  Object.values(care.regions).filter(
    (r): r is RegionCare => !!r && 'items' in r,
  );
const allItems = (care: FamilyCare): CareItem[] =>
  regionCares(care).flatMap((r) => r.items);

describe('tree care completeness (the add-plant playbook)', () => {
  it('every catalogue tree family has care data or is pending', () => {
    const missing = families.filter(
      (f) => !TREE_CARE[f] && !CARE_PENDING.includes(f),
    );
    expect(missing).toEqual([]);
  });

  it('care exists for every region the catalogue grows the family in', () => {
    const gaps: string[] = [];
    for (const [family, care] of Object.entries(TREE_CARE)) {
      for (const region of grownByCatalogue(family)) {
        if (!care.grownIn.includes(region))
          gaps.push(`${family}: grownIn lacks ${region}`);
        const entry = care.regions[region];
        const target =
          entry && 'sameAs' in entry ? care.regions[entry.sameAs] : entry;
        if (!target || !('items' in target))
          gaps.push(`${family}: no care for ${region}`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it('no family is both pending and done', () => {
    expect(CARE_PENDING.filter((f) => TREE_CARE[f])).toEqual([]);
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
