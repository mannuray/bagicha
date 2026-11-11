import { RegionCluster } from '@prisma/client';
import {
  CROPS,
  climateGroupFor,
  cropById,
  nextWindow,
  windowStatus,
} from './crop-calendar';

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
  it('has 26 crops, each with a botanical family and a method, nursery crops with transplant timing', () => {
    expect(CROPS).toHaveLength(26);
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
    for (const crop of CROPS) {
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
