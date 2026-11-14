import { RegionCluster } from '@prisma/client';
import {
  CATALOGUE_SEED,
  Catalogue,
  validateSeed,
  type CropInfo,
} from '../../catalogue';
import {
  climateGroupFor,
  inGroup,
  nextWindow,
  sproutCheckTitle,
  titleName,
  windowStatus,
} from './crop-calendar';

/** The approved calendar values live in the catalogue seed; these tests pin them. */
const seeded = Catalogue.from(validateSeed(CATALOGUE_SEED), 1);
const CROPS = seeded.listedCrops();
const FLOWERS = CROPS.filter((c) => c.kind === 'FLOWER');
const cropById = (id: string) => seeded.crop(id);
const journeyOf = (crop: CropInfo) => seeded.method(crop.method).journey;

const at = (iso: string) => new Date(`${iso}T06:00:00Z`);

describe('climateGroupFor', () => {
  it('groups the seven regions into plains, peninsular and hills', () => {
    expect(climateGroupFor(RegionCluster.NORTH_INDIA)).toBe('PLAINS');
    expect(climateGroupFor(RegionCluster.EAST_INDIA)).toBe('PLAINS');
    expect(climateGroupFor(RegionCluster.CENTRAL_INDIA)).toBe('PLAINS');
    expect(climateGroupFor(RegionCluster.WEST_INDIA)).toBe('PLAINS');
    expect(climateGroupFor(RegionCluster.SOUTH_DECCAN)).toBe('PENINSULAR');
    expect(climateGroupFor(RegionCluster.COASTAL_HUMID)).toBe('PENINSULAR');
    expect(climateGroupFor(RegionCluster.HILLS_COOL)).toBe('HILLS');
  });
});

describe('the calendar data', () => {
  it('has 37 crops, each with a botanical family and a method, nursery crops with transplant timing', () => {
    expect(CROPS.filter((c) => c.kind === 'CROP')).toHaveLength(37);
    const families = [
      'SOLANACEAE',
      'BRASSICACEAE',
      'FABACEAE',
      'CUCURBITACEAE',
      'APIACEAE',
      'AMARANTHACEAE',
      'AMARYLLIDACEAE',
      'ASTERACEAE',
      'MALVACEAE',
      'ZINGIBERACEAE',
    ];
    for (const crop of CROPS.filter((c) => c.kind === 'CROP')) {
      expect(families).toContain(crop.family);
      if (crop.method === 'NURSERY_TRANSPLANT')
        expect(crop.transplant_after_days).not.toBeNull();
      else expect(crop.transplant_after_days).toBeNull();
    }
    expect(cropById('potato')?.family).toBe('SOLANACEAE');
    expect(cropById('radish')?.family).toBe('BRASSICACEAE');
    expect(cropById('methi')?.family).toBe('FABACEAE');
    expect(cropById('onion')?.method).toBe('NURSERY_TRANSPLANT');
    expect(cropById('nope')).toBeNull();
  });

  it('marks quick crops from days to first harvest', () => {
    expect(cropById('methi')?.tags).toContain('quick');
    expect(cropById('tomato')?.tags).not.toContain('quick');
  });

  it('never asks to thin before the seedlings-came-up check', () => {
    const early = [...CROPS, ...FLOWERS].filter(
      (c) => c.thin_after_days && c.thin_after_days <= c.germination_days[1],
    );
    expect(early.map((c) => c.id)).toEqual([]);
  });

  it('garlic answers to the common spellings of lahsun', () => {
    expect(cropById('garlic')?.aliases).toEqual(
      expect.arrayContaining(['lehsun', 'lahsun', 'lasun', 'lashun']),
    );
  });

  it('carrot: up in 8–10 days, thinned on day 30 (TNAU)', () => {
    expect(cropById('carrot')).toMatchObject({
      germination_days: [8, 10],
      thin_after_days: 30,
    });
  });
});

describe('windowStatus', () => {
  const tomato = cropById('tomato')!;
  it('is open inside a window', () => {
    expect(windowStatus(tomato, 'PLAINS', at('2026-09-10'))).toMatchObject({
      status: 'open',
      window_index: 0,
    });
  });
  it('is soon when a window opens within 30 days', () => {
    expect(windowStatus(tomato, 'PLAINS', at('2026-08-20'))).toMatchObject({
      status: 'soon',
      opens_in_days: 12,
    });
  });
  it('looks across the year end', () => {
    expect(windowStatus(tomato, 'PLAINS', at('2026-12-15'))).toMatchObject({
      status: 'soon',
      opens_in_days: 17,
      window_index: 1,
    });
  });
  it('is later otherwise, with the next month', () => {
    expect(windowStatus(tomato, 'PLAINS', at('2026-04-10'))).toMatchObject({
      status: 'later',
      next_month: 9,
    });
  });
  it('handles a window that wraps the year', () => {
    expect(
      windowStatus(cropById('radish')!, 'PLAINS', at('2027-01-15')).status,
    ).toBe('open');
  });
});

describe('nextWindow', () => {
  const tomato = cropById('tomato')!;
  it('takes the open window, unless a season already started in it', () => {
    const open = nextWindow(tomato, 'PLAINS', at('2026-09-10'), []);
    expect(open?.start.toISOString()).toBe('2026-08-31T18:30:00.000Z');
    const next = nextWindow(tomato, 'PLAINS', at('2026-09-10'), [open!.start]);
    expect(next?.start.toISOString()).toBe('2026-12-31T18:30:00.000Z');
  });
});

describe('crop descriptions and sun needs', () => {
  it('every crop has a description, a scientific name and a sun need', () => {
    for (const crop of CROPS) {
      expect(crop.description.length).toBeGreaterThan(10);
      expect(crop.scientific_name).toMatch(/^[A-Z][a-z]+ [a-z]+/);
      expect(['FULL', 'PARTIAL']).toContain(crop.sun);
    }
    expect(cropById('palak')?.sun).toBe('PARTIAL');
    expect(cropById('tomato')?.sun).toBe('FULL');
  });
});

describe('flowers on the calendar', () => {
  it('lists 16 flowers, each complete', () => {
    expect(FLOWERS).toHaveLength(16);
    for (const f of FLOWERS) {
      expect(f.kind).toBe('FLOWER');
      expect(f.aliases.some((a) => /[\u0900-\u097F]/.test(a))).toBe(true);
      for (const group of ['PLAINS', 'PENINSULAR', 'HILLS'] as const) {
        expect(f.windows[group].length).toBeGreaterThan(0);
        for (const [a, b] of f.windows[group]) {
          expect(a).toBeGreaterThanOrEqual(1);
          expect(b).toBeLessThanOrEqual(12);
        }
      }
      expect(f.days_to_first_harvest[0]).toBeLessThan(
        f.days_to_first_harvest[1],
      );
      expect(f.care.some((c) => c.key === 'deadhead')).toBe(true);
      expect(f.scientific_name).not.toBe('');
      expect(f.description).not.toBe('');
    }
  });

  it('keeps vegetables as CROP, and finds flowers by id', () => {
    expect(CROPS.filter((c) => c.kind === 'CROP')).toHaveLength(37);
    expect(cropById('marigold')?.kind).toBe('FLOWER');
    expect(cropById('tomato')?.kind).toBe('CROP');
  });
});

describe('titleName', () => {
  it('drops the Hindi name in brackets and lower-cases, for task titles', () => {
    expect(titleName(cropById('palak')!)).toBe('spinach');
    expect(titleName(cropById('marigold')!)).toBe('marigold');
    expect(titleName(cropById('tomato')!)).toBe('tomato');
  });

  it('no crop or flower title keeps a bracket', () => {
    for (const crop of CROPS) expect(titleName(crop)).not.toMatch(/[()]/);
  });

  it('the seedling check uses the short name', () => {
    expect(
      sproutCheckTitle(
        cropById('palak')!,
        journeyOf(cropById('palak')!),
        false,
      ),
    ).toBe('Check the sown spinach for sprouts');
  });
});

describe('sproutCheckTitle', () => {
  const crop = (id: string) => cropById(id)!;

  it('says seedlings only for seeds raised in a tray', () => {
    expect(
      sproutCheckTitle(crop('tomato'), journeyOf(crop('tomato')), true),
    ).toBe('Check the tomato seedlings have come up');
  });

  it('seeds sown in the bed sprout; no seedlings', () => {
    expect(sproutCheckTitle(crop('peas'), journeyOf(crop('peas')), false)).toBe(
      'Check the sown peas for sprouts',
    );
    expect(
      sproutCheckTitle(crop('tomato'), journeyOf(crop('tomato')), false),
    ).toBe('Check the sown tomato for sprouts');
  });

  it('tubers, cloves and rhizomes send up shoots', () => {
    expect(
      sproutCheckTitle(crop('garlic'), journeyOf(crop('garlic')), false),
    ).toBe('Check the planted garlic for shoots');
    expect(
      sproutCheckTitle(crop('potato'), journeyOf(crop('potato')), false),
    ).toBe('Check the planted potato for shoots');
  });

  it('every title fits a reminder (60 characters)', () => {
    const titles = [...CROPS, ...FLOWERS].flatMap((c) => [
      sproutCheckTitle(c, journeyOf(c), true),
      sproutCheckTitle(c, journeyOf(c), false),
    ]);
    expect(titles.filter((t) => t.length > 60)).toEqual([]);
  });
});

/** Spot checks from the approved tables (owner yes, 2026-11-13). */
describe('black carrot, chana and khesari', () => {
  it('black carrot: desi type, sown Aug–Sep in the plains only (PAU)', () => {
    expect(cropById('black_carrot')).toMatchObject({
      name: 'Black carrot',
      family: 'APIACEAE',
      method: 'DIRECT_SOW',
      windows: { PLAINS: [[8, 9]], PENINSULAR: [], HILLS: [] },
      germination_days: [7, 10],
      thin_after_days: 30,
      days_to_first_harvest: [90, 100],
      harvest_span_days: 15,
    });
    expect(cropById('black_carrot')?.aliases).toContain('kali gajar');
  });

  it('chana: Oct–Nov sowing, tips pinched on day 35', () => {
    expect(cropById('chana')).toMatchObject({
      family: 'FABACEAE',
      windows: { PLAINS: [[10, 11]], PENINSULAR: [[10, 11]], HILLS: [] },
      germination_days: [7, 15],
      care: [{ key: 'pinch', after: 'SOWING', days: 35 }],
    });
  });

  it('chana ripens at 153–170 days in the plains (PAU) and 85 in the south (TNAU)', () => {
    const chana = cropById('chana')!;
    expect(inGroup(chana, 'PLAINS').days_to_first_harvest).toEqual([153, 170]);
    expect(inGroup(chana, 'PENINSULAR').days_to_first_harvest).toEqual([
      85, 85,
    ]);
    expect(inGroup(cropById('carrot')!, 'PENINSULAR')).toEqual(
      cropById('carrot'),
    );
  });

  it('khesari: plains only, ready at 110–120 days, low-ODAP varieties named', () => {
    const khesari = cropById('khesari')!;
    expect(khesari).toMatchObject({
      windows: { PLAINS: [[10, 11]], PENINSULAR: [], HILLS: [] },
      germination_days: [5, 7],
      days_to_first_harvest: [110, 120],
    });
    expect(khesari.description).toMatch(/Ratan|Mahateora/);
  });
});

describe('the batch-9 vegetables (approved review, 2026-11-14)', () => {
  const approved: Array<[string, Record<string, unknown>]> = [
    [
      'beetroot',
      {
        family: 'AMARANTHACEAE',
        method: 'DIRECT_SOW',
        windows: { PLAINS: [[9, 11]], PENINSULAR: [[7, 8]], HILLS: [[3, 4]] },
        germination_days: [5, 10],
        thin_after_days: 20,
        days_to_first_harvest: [60, 75],
        harvest_span_days: 15,
        succession_every_days: null,
        care: [],
        sun: 'FULL',
        guide: expect.objectContaining({ spacing_cm: [30, 10] }),
      },
    ],
    [
      'turnip',
      {
        family: 'BRASSICACEAE',
        method: 'DIRECT_SOW',
        windows: { PLAINS: [[8, 11]], PENINSULAR: [], HILLS: [[7, 10]] },
        germination_days: [4, 6],
        thin_after_days: 15,
        days_to_first_harvest: [45, 60],
        harvest_span_days: 10,
        succession_every_days: 15,
        care: [{ key: 'earth_up', after: 'SOWING', days: 21 }],
        guide: expect.objectContaining({ spacing_cm: [30, 10] }),
      },
    ],
    [
      'amaranth',
      {
        family: 'AMARANTHACEAE',
        method: 'DIRECT_SOW',
        windows: {
          PLAINS: [
            [2, 3],
            [6, 7],
          ],
          PENINSULAR: [[1, 12]],
          HILLS: [],
        },
        germination_days: [3, 7],
        thin_after_days: 8,
        days_to_first_harvest: [25, 35],
        harvest_span_days: 60,
        care: [],
        guide: expect.objectContaining({ spacing_cm: [20, 15] }),
      },
    ],
    [
      'bathua',
      {
        family: 'AMARANTHACEAE',
        method: 'DIRECT_SOW',
        windows: { PLAINS: [[10, 11]], PENINSULAR: [], HILLS: [] },
        germination_days: [5, 10],
        thin_after_days: null,
        days_to_first_harvest: [40, 45],
        harvest_span_days: 80,
        care: [],
        guide: expect.objectContaining({ spacing_cm: [30, 20] }),
      },
    ],
    [
      'sem',
      {
        family: 'FABACEAE',
        method: 'DIRECT_SOW',
        windows: { PLAINS: [[6, 7]], PENINSULAR: [[7, 8]], HILLS: [] },
        germination_days: [4, 10],
        days_to_first_harvest: [125, 125],
        harvest_span_days: 90,
        care: [{ key: 'trellis', after: 'SOWING', days: 20 }],
        guide: expect.objectContaining({ spacing_cm: [100, 75] }),
      },
    ],
    [
      'lobia',
      {
        family: 'FABACEAE',
        method: 'DIRECT_SOW',
        windows: {
          PLAINS: [
            [2, 4],
            [6, 7],
          ],
          PENINSULAR: [
            [2, 3],
            [6, 7],
          ],
          HILLS: [[4, 5]],
        },
        germination_days: [6, 10],
        days_to_first_harvest: [45, 55],
        harvest_span_days: 30,
        care: [],
        sun: 'FULL',
        guide: expect.objectContaining({ spacing_cm: [45, 15] }),
      },
    ],
    [
      'tinda',
      {
        family: 'CUCURBITACEAE',
        method: 'DIRECT_SOW',
        windows: {
          PLAINS: [
            [2, 3],
            [6, 7],
          ],
          PENINSULAR: [],
          HILLS: [[4, 5]],
        },
        germination_days: [5, 15],
        days_to_first_harvest: [54, 60],
        harvest_span_days: 30,
        care: [],
        guide: expect.objectContaining({ spacing_cm: [150, 45] }),
      },
    ],
    [
      'ash_gourd',
      {
        family: 'CUCURBITACEAE',
        method: 'DIRECT_SOW',
        windows: {
          PLAINS: [
            [2, 3],
            [6, 7],
          ],
          PENINSULAR: [
            [1, 1],
            [7, 7],
          ],
          HILLS: [[4, 5]],
        },
        germination_days: [4, 10],
        days_to_first_harvest: [110, 150],
        harvest_span_days: 45,
        care: [],
        guide: expect.objectContaining({ spacing_cm: [300, 90] }),
      },
    ],
  ];

  it.each(approved)('%s matches the approved table', (id, values) => {
    expect(cropById(id)).toMatchObject({ kind: 'CROP', ...values });
  });

  it('every new crop is full sun and has a Devanagari alias', () => {
    for (const [id] of approved) {
      expect(cropById(id)?.sun).toBe('FULL');
      expect(
        cropById(id)?.aliases.some((a) => /\p{Script=Devanagari}/u.test(a)),
      ).toBe(true);
    }
  });

  it('leaves out aliases other crops already own', () => {
    expect(cropById('lobia')?.aliases).not.toContain('barbati');
    expect(cropById('ash_gourd')?.aliases).not.toContain('kaddu');
    expect(cropById('sem')?.aliases).not.toContain('bean');
  });

  it('parwal and spring onion are held back', () => {
    expect(cropById('parwal')).toBeNull();
    expect(cropById('spring_onion')).toBeNull();
  });
});
