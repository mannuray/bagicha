import { careForTree } from '../../domain/care-kind';
import { CATALOGUE_SEED } from '..';

const citrus = CATALOGUE_SEED.treeCare.find((c) => c.family === 'citrus')!;
const entries = CATALOGUE_SEED.fruitPlants.filter(
  (p) => p.species_family === 'citrus' && p.status === 'APPROVED',
);
/** The kind a tree added from this entry gets (its name defaults to the entry's). */
const kindOf = (key: string): string | null => {
  const e = entries.find((p) => p.key === key)!;
  const care = careForTree(citrus, {
    variety: e.variety,
    species: e.species,
    name: e.display_name,
  });
  return care ? care.family.replace('citrus:', '') : null;
};

describe('citrus care by kind (owner-approved 2026-11-18)', () => {
  it('every citrus add-tree entry gets the kind the review approved', () => {
    const approved: Record<string, string | null> = {
      citrus: null,
      'citrus:Kagzi': 'lime',
      'citrus:Baramasi': 'lemon',
      'citrus:Galgal': 'lemon',
      'citrus:Assam lemon': 'lemon',
      'citrus:Gondhoraj': null,
      'citrus:kinnow': 'mandarin',
      'citrus:Nagpur': 'mandarin',
      'citrus:Darjeeling': 'mandarin',
      'citrus:mosambi': 'sweet_orange',
      'citrus:Malta': 'sweet_orange',
      'citrus:Sathgudi': 'sweet_orange',
      'citrus:Chakotra': null,
    };
    expect(
      Object.fromEntries(entries.map((e) => [e.key, kindOf(e.key)])),
    ).toEqual(approved);
  });

  it('Seedless leaves search; trees already added from it keep the season pack', () => {
    const seedless = CATALOGUE_SEED.fruitPlants.find(
      (p) => p.key === 'citrus:Seedless',
    );
    expect(seedless?.status).toBe('RETIRED');
  });

  it('words that fit several kinds pick none', () => {
    for (const name of ['nimbu', 'Lemon', 'santra', 'orange', 'नींबू'])
      expect(careForTree(citrus, { name })).toBeNull();
  });

  it('a place or pet name in the tree name picks no kind', () => {
    for (const name of ['Nimbu from Nagpur', 'Coorg lemon', 'Daisy'])
      expect(careForTree(citrus, { name, species: 'lemon' })).toBeNull();
  });

  it('tree-page windows follow the approved wording', () => {
    const north = (kind: string, key: string) => {
      const k = citrus.kinds!.find((c) => c.key === kind)!;
      const region = k.regions.NORTH_INDIA as {
        items: Array<{ key: string; when: unknown }>;
      };
      return region.items.filter((i) => i.key === key).map((i) => i.when);
    };
    const cal = (from: [number, number], to: [number, number]) => ({
      kind: 'CALENDAR',
      from,
      to,
    });
    // "Before the monsoon"
    expect(north('lemon', 'canker_spots')).toEqual([cal([5, 1], [6, 30])]);
    // No months given: whenever the gardener sees it
    expect(north('lime', 'fruit_drop')).toEqual([cal([1, 1], [12, 31])]);
    // Second week of August until picking (Valencia, the last, in March)
    expect(north('sweet_orange', 'fruit_fly_trap')).toEqual([
      cal([8, 8], [3, 31]),
    ]);
  });

  it('kaffir (makrut) lime and "seasonal nimbu" pick no kind', () => {
    for (const name of ['Kaffir lime', 'makrut lime', 'मौसमी नींबू'])
      expect(careForTree(citrus, { name })).toBeNull();
    expect(careForTree(citrus, { variety: 'मौसमी' })?.family).toBe(
      'citrus:sweet_orange',
    );
  });

  it('kagzi lime and kagzi nimbu are lime words, as approved', () => {
    const lime = citrus.kinds!.find((k) => k.key === 'lime')!;
    expect(lime.words).toEqual(
      expect.arrayContaining(['kagzi lime', 'kagzi nimbu']),
    );
  });

  it('a window ending in February covers the 29th', () => {
    const febEnds = (citrus.kinds ?? []).flatMap((k) =>
      Object.values(k.regions).flatMap((r) =>
        r && 'items' in r
          ? r.items.flatMap((i) =>
              i.when.kind === 'CALENDAR' && i.when.to[0] === 2
                ? [i.when.to[1]]
                : [],
            )
          : [],
      ),
    );
    expect(febEnds.length).toBeGreaterThan(0);
    // Month-end windows run to the 29th; a set day (Kinnow picking, Feb 15) stays.
    expect(febEnds).toContain(29);
    expect(febEnds).not.toContain(28);
  });

  it('sweet lime is sweet orange, plain lime is lime', () => {
    expect(careForTree(citrus, { name: 'sweet lime' })?.family).toBe(
      'citrus:sweet_orange',
    );
    expect(careForTree(citrus, { name: 'lime' })?.family).toBe('citrus:lime');
  });

  it("every region a kind has no checked care for is pending, so no tree gets another region's care", () => {
    const ALL = [
      'CENTRAL_INDIA',
      'COASTAL_HUMID',
      'EAST_INDIA',
      'HILLS_COOL',
      'NORTH_INDIA',
      'SOUTH_DECCAN',
      'WEST_INDIA',
    ];
    for (const kind of citrus.kinds ?? [])
      expect(
        [...Object.keys(kind.regions), ...(kind.pendingRegions ?? [])].sort(),
      ).toEqual(ALL);
  });

  it('ships North India for every kind, and South Deccan for lime and sweet orange', () => {
    const ships = Object.fromEntries(
      (citrus.kinds ?? []).map((k) => [k.key, Object.keys(k.regions).sort()]),
    );
    expect(ships).toEqual({
      lime: ['NORTH_INDIA', 'SOUTH_DECCAN'],
      lemon: ['NORTH_INDIA'],
      mandarin: ['NORTH_INDIA'],
      sweet_orange: ['NORTH_INDIA', 'SOUTH_DECCAN'],
    });
  });
});
