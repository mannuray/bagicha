import type { FamilyCare, RegionCare, TreeCareItem } from '../domain/tree-care';
import { CATALOGUE_SEED } from '.';

/** Every region's own care (sameAs regions share it), for a family or each of its kinds. */
function regionCares(care: FamilyCare): Array<[string, RegionCare]> {
  const own = (label: string, regions: FamilyCare['regions']) =>
    Object.entries(regions).flatMap(([region, entry]) =>
      entry && 'items' in entry
        ? [[`${label} ${region}`, entry] as [string, RegionCare]]
        : [],
    );
  return [
    ...own(care.family, care.regions),
    ...(care.kinds ?? []).flatMap((k) =>
      own(`${care.family}:${k.key}`, k.regions),
    ),
  ];
}

const missingTexts = (item: TreeCareItem): string[] =>
  (['title', 'organic', 'chemical', 'why', 'conditional'] as const).filter(
    (field) => item[field] && !item.hi?.[field],
  );

/**
 * Hindi round 2: everything a Hindi-speaking gardener reads from approved tree
 * care and the home season tips has Hindi (owner-reviewed before release).
 */
describe('Hindi is written for approved care and season tips', () => {
  it('every care item and phase list', () => {
    const missing: string[] = [];
    for (const care of CATALOGUE_SEED.treeCare.filter(
      (c) => c.status === 'APPROVED',
    ))
      for (const [label, region] of regionCares(care)) {
        for (const item of region.items) {
          const fields = missingTexts(item);
          if (fields.length)
            missing.push(`${label} ${item.key}: ${fields.join(', ')}`);
        }
        for (const phase of region.phases)
          for (const list of ['avoid', 'watch'] as const)
            if (phase[list].length && !phase.hi?.[list])
              missing.push(`${label} phase ${phase.phase}: ${list}`);
      }
    expect(missing).toEqual([]);
  });

  it('every season-tip month', () => {
    const missing = CATALOGUE_SEED.seasonGuide.flatMap((g) =>
      g.months.flatMap((m, i) =>
        m.hi?.season && m.hi.headline && m.hi.points
          ? []
          : [`${g.region} month ${i + 1}`],
      ),
    );
    expect(missing).toEqual([]);
  });

  it('every advice text', () => {
    expect(
      CATALOGUE_SEED.advice
        .filter((a) => a.status === 'APPROVED' && !a.hi)
        .map((a) => a.key),
    ).toEqual([]);
  });
});
