import { readFileSync } from 'node:fs';
import { inPolygon, type Polygon } from './domain/geometry';
import { DistrictLocator } from './district-locator';

describe('DistrictLocator', () => {
  const locator = new DistrictLocator();

  it.each([
    [
      'Patna city',
      25.594,
      85.137,
      {
        district: 'Patna',
        state: 'Bihar',
        region: 'EAST_INDIA',
        label: 'Patna',
      },
    ],
    [
      'Gaya',
      24.79,
      85.0,
      { district: 'Gaya', state: 'Bihar', region: 'EAST_INDIA', label: 'Gaya' },
    ],
    [
      'Bengaluru',
      12.97,
      77.59,
      {
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        region: 'SOUTH_DECCAN',
      },
    ],
    [
      'Shimla',
      31.1,
      77.17,
      { district: 'Shimla', state: 'Himachal Pradesh', region: 'HILLS_COOL' },
    ],
    [
      'Gilgit',
      35.92,
      74.31,
      {
        district: 'Gilgit-Baltistan and Aksai Chin',
        state: 'Ladakh',
        region: 'HILLS_COOL',
      },
    ],
    [
      'Aurangabad (Bihar)',
      24.75,
      84.37,
      { district: 'Aurangabad', state: 'Bihar', label: 'Aurangabad, Bihar' },
    ],
  ])('finds %s', (_, lat, lng, expected) => {
    expect(locator.locate(lat, lng)).toMatchObject(expected);
  });

  it.each([
    ['Kavaratti (Lakshadweep)', 10.563, 72.637, 'Lakshadweep'],
    ['Agatti (Lakshadweep)', 10.86, 72.19, 'Lakshadweep'],
    ['Minicoy (Lakshadweep)', 8.28, 73.05, 'Lakshadweep'],
    ['Diu', 20.71, 70.98, 'Diu'],
    ['Campbell Bay (Great Nicobar)', 7.0, 93.93, 'Nicobar'],
    // The source draws Yanam a little east of the town's listed centre; a point in its mapped area.
    ['Yanam', 16.7, 82.25, 'Yanam'],
  ])('finds small islands and enclaves: %s', (_, lat, lng, district) => {
    expect(locator.locate(lat, lng)?.district).toBe(district);
  });

  it.each([
    ['the Bay of Bengal', 15.0, 88.0],
    ['Kathmandu', 27.71, 85.32],
    ['a point off the map', 60, 10],
  ])('answers null for %s', (_, lat, lng) => {
    expect(locator.locate(lat, lng)).toBeNull();
  });

  it('loads the boundary file once, however often it is asked', () => {
    const read = jest.fn((path: string) => readFileSync(path, 'utf8'));
    const counted = new DistrictLocator(read);
    for (let i = 0; i < 100; i++) counted.locate(25.594, 85.137);
    expect(read).toHaveBeenCalledTimes(1);
  });
});

describe('point in polygon', () => {
  // A 10×10 square with a 2×2 hole in the middle (an enclave).
  const square: Polygon = [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
    [
      [4, 4],
      [6, 4],
      [6, 6],
      [4, 6],
      [4, 4],
    ],
  ];

  it('treats a hole as outside', () => {
    expect(inPolygon([5, 5], square)).toBe(false);
    expect(inPolygon([2, 2], square)).toBe(true);
  });
});
