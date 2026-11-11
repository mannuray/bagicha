import { linkShape } from './link-shapes';

describe('linking boundary shapes to the district list', () => {
  it('links by name or alias within the state the shape lies in', () => {
    expect(
      linkShape({ name: 'Gurgaon', state: 'Haryāna', lng: 77, lat: 28.4 }),
    ).toMatchObject({ name: 'Gurugram', state: 'Haryana' });
    expect(
      linkShape({ name: 'Hydrabad', state: 'Telangāna', lng: 78.4, lat: 17.4 }),
    ).toMatchObject({ name: 'Hyderabad' });
    expect(
      linkShape({ name: 'Leh(Ladakh)', state: 'Ladākh', lng: 77.6, lat: 34.2 }),
    ).toMatchObject({ name: 'Leh' });
  });

  it('tells shared names and Delhi directions apart by state', () => {
    expect(
      linkShape({ name: 'Aurangabad', state: 'Bihār', lng: 84.4, lat: 24.7 })
        ?.state,
    ).toBe('Bihar');
    expect(
      linkShape({
        name: 'Aurangabad',
        state: 'Mahārāshtra',
        lng: 75.3,
        lat: 19.9,
      })?.name,
    ).toBe('Chhatrapati Sambhajinagar');
    expect(
      linkShape({ name: 'East', state: 'Delhi', lng: 77.3, lat: 28.6 }),
    ).toMatchObject({ name: 'East', state: 'Delhi' });
  });

  it('falls back to a unique name in any state when the state join is off (Yanam, Lakshadweep)', () => {
    expect(
      linkShape({
        name: 'Yanam',
        state: 'Andhra Pradesh',
        lng: 82.2,
        lat: 16.7,
      })?.state,
    ).toBe('Puducherry');
    expect(
      linkShape({ name: 'Lakshadweep', state: '?', lng: 72.6, lat: 10.6 })
        ?.state,
    ).toBe('Lakshadweep');
  });

  it('splits the area India counts as its own at latitude 35: PoK to J&K, Gilgit-Baltistan to Ladakh (spec §2.5.4)', () => {
    expect(
      linkShape({
        name: 'DATA NOT AVAILABLE',
        state: 'Ladākh',
        lng: 73.47,
        lat: 34.37,
      }),
    ).toMatchObject({
      name: 'Pakistan-occupied Kashmir',
      state: 'Jammu and Kashmir',
    });
    expect(
      linkShape({
        name: 'DATA NOT AVAILABLE',
        state: 'Ladākh',
        lng: 74.3,
        lat: 35.9,
      }),
    ).toMatchObject({
      name: 'Gilgit-Baltistan and Aksai Chin',
      state: 'Ladakh',
    });
  });

  it('returns null for a name the list does not know', () => {
    expect(
      linkShape({ name: 'Atlantis', state: 'Bihār', lng: 85, lat: 25 }),
    ).toBeNull();
  });
});
