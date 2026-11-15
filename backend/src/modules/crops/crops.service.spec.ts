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
