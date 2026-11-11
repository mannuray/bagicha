import {
  bloomStatus,
  flowerCareDue,
  PERENNIAL_FLOWERS,
  perennialFlower,
} from './flower-care';

const ist = (iso: string) => new Date(`${iso}T06:00:00Z`);

describe('perennial flowers', () => {
  it('every perennial flower has bloom and care months for all three groups', () => {
    expect(PERENNIAL_FLOWERS).toHaveLength(10);
    for (const f of PERENNIAL_FLOWERS) {
      expect(f.aliases.some((a) => /[ऀ-ॿ]/.test(a))).toBe(true);
      for (const g of ['PLAINS', 'PENINSULAR', 'HILLS'] as const) {
        expect(f.bloom[g].length).toBeGreaterThan(0);
        expect(f.care[g].length).toBeGreaterThan(0);
        for (const c of f.care[g]) expect(c.month).toBeGreaterThanOrEqual(1);
      }
      expect(f.first_bloom_months[0]).toBeLessThan(f.first_bloom_months[1]);
    }
  });

  it('lists care due this month and next, keyed by year', () => {
    const rose = perennialFlower('rose')!;
    const sept = flowerCareDue(rose, 'PLAINS', ist('2026-09-20'));
    expect(sept.map((c) => c.sourceKey)).toEqual(['rose:prune:2026-10']);
    expect(sept[0].due.toISOString()).toBe('2026-09-30T18:30:00.000Z');
    const nov = flowerCareDue(rose, 'PLAINS', ist('2026-11-05'));
    expect(nov.map((c) => c.key)).toContain('feed');
    expect(nov.map((c) => c.key)).not.toContain('prune');
    expect(nov.find((c) => c.key === 'feed')!.due.getTime()).toBe(
      ist('2026-11-05').getTime(),
    );
  });

  it('keys a January task seen in December with the next year', () => {
    const champa = perennialFlower('plumeria')!;
    const due = flowerCareDue(champa, 'PLAINS', ist('2026-12-10'));
    expect(due.map((c) => c.sourceKey)).toContain('plumeria:prune:2027-01');
  });

  it('reports bloom status', () => {
    const mogra = perennialFlower('jasmine')!;
    expect(bloomStatus(mogra, 'PLAINS', ist('2026-04-10'))).toEqual({
      status: 'in_season',
      window_label: 'Mar–Jun',
    });
    expect(bloomStatus(mogra, 'PLAINS', ist('2026-10-10'))).toEqual({
      status: 'later',
      window_label: 'Mar–Jun',
    });
  });

  it('gives each care month its own key, so a second feed in the year is not lost', () => {
    const hibiscus = perennialFlower('hibiscus')!;
    const march = flowerCareDue(hibiscus, 'PLAINS', ist('2026-03-05')).map(
      (c) => c.sourceKey,
    );
    const may = flowerCareDue(hibiscus, 'PLAINS', ist('2026-05-05')).map(
      (c) => c.sourceKey,
    );
    expect(march).toContain('hibiscus:feed:2026-03');
    expect(may).toContain('hibiscus:feed:2026-05');
  });
});
