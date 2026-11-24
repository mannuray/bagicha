import type { User } from '@prisma/client';
import { FixedClock } from '../../common/time';
import { hindiSeed, seededCatalogueStore } from '../catalogue/testing';
import type { CropPlanService, GardenPlaceRepository } from '../plant-ledger';
import { CropsService } from './crops.service';

const user = { region_cluster: 'NORTH_INDIA', district: 'Lucknow' } as User;
const service = (seed = hindiSeed()) =>
  new CropsService(
    new FixedClock(new Date('2026-10-05T06:00:00Z')),
    {} as GardenPlaceRepository,
    {} as CropPlanService,
    seededCatalogueStore(seed),
  );

describe('crops in the request language', () => {
  it('gives a crop its Hindi texts and Hindi month names', async () => {
    const tomato = await service().detail(user, 'tomato', 'hi');
    expect(tomato.name).toBe('टमाटर');
    // The English name rides along, so search by it still works in Hindi.
    expect(tomato.name_en).toBe('Tomato');
    expect(tomato.method_label).toBe('नर्सरी, फिर रोपाई');
    expect(tomato.windows[0].label).toMatch(/[ऀ-ॿ]/);
  });

  it('keeps English for a crop with no Hindi, inside a Hindi answer', async () => {
    const seed = hindiSeed();
    const noHindi = {
      ...seed,
      crops: seed.crops.map((c) =>
        c.id === 'brinjal' ? { ...c, hi: undefined } : c,
      ),
    };
    const calendar = await service(noHindi).calendar(user, 'hi');
    const brinjal = calendar.find((c) => c.id === 'brinjal')!;
    expect(brinjal.name).toMatch(/^Brinjal/);
    expect(brinjal.method_label).toBe('नर्सरी, फिर रोपाई');
  });

  it('answers English exactly as before', async () => {
    const plain = await service().detail(user, 'tomato', 'en');
    expect(plain.name).toBe('Tomato');
    expect(plain.method_label).toBe('Nursery, then transplant');
    expect(plain.windows[0].label).toMatch(/^[A-Z][a-z]{2}–[A-Z][a-z]{2}$/);
  });
});

describe('crop rotation dates', () => {
  it('dates an undated last season by the injected clock, never the machine clock', async () => {
    const places = {
      findOwned: () => Promise.resolve({ id: 'bed' }),
      lastClosedSeason: () =>
        Promise.resolve({
          started_at: null,
          closed_at: null,
          plant: { crop_id: 'tomato' },
        }),
    } as unknown as GardenPlaceRepository;
    const svc = new CropsService(
      new FixedClock(new Date('2026-10-05T06:00:00Z')),
      places,
      {} as CropPlanService,
      seededCatalogueStore(hindiSeed()),
    );
    const r = await svc.rotation('u', 'bed', 'brinjal');
    // The machine clock says November 2026; the injected clock says October.
    expect(r.last?.season_label).toMatch(/Oct/);
  });
});
