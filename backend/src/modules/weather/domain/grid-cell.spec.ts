import { gridCell } from './grid-cell';

describe('gridCell', () => {
  it('snaps a point to the centre of its 0.1° cell', () => {
    expect(gridCell(25.6123, 85.1376)).toEqual({
      lat: 25.65,
      lng: 85.15,
      key: '25.6,85.1',
    });
  });

  it('puts points within the same cell on one key (shared cache)', () => {
    expect(gridCell(25.6001, 85.1001).key).toBe(gridCell(25.6999, 85.1999).key);
  });

  it('starts a new cell exactly on the boundary', () => {
    expect(gridCell(25.7, 85.1).key).toBe('25.7,85.1');
  });

  it('handles negative coordinates', () => {
    expect(gridCell(-0.05, -0.05)).toEqual({
      lat: -0.05,
      lng: -0.05,
      key: '-0.1,-0.1',
    });
  });
});
