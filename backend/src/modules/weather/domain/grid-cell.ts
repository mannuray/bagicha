/** A 0.1° (about 11 km) square: the unit weather is fetched, cached and logged by. */
export interface GridCell {
  /** The cell's centre, sent to providers. */
  lat: number;
  lng: number;
  /** The cell's south-west corner, e.g. "25.6,85.1": cache key and log field. */
  key: string;
}

const STEP = 10; // cells per degree

/** Snaps a point to its cell, so a user's exact place never leaves this function. */
export function gridCell(lat: number, lng: number): GridCell {
  // Round first so 25.7 (stored as 25.69999…) lands in its own cell.
  const corner = (v: number) =>
    Math.floor(Math.round(v * STEP * 1e6) / 1e6) / STEP;
  const south = corner(lat);
  const west = corner(lng);
  const centre = (v: number) => Math.round((v + 0.05) * 100) / 100;
  return {
    lat: centre(south),
    lng: centre(west),
    key: `${south.toFixed(1)},${west.toFixed(1)}`,
  };
}
