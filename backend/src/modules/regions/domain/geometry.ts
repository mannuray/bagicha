/** Plain-array geometry for district lookup: [lng, lat] points, rings, polygons (outer ring + holes). */
export type Point = [number, number];
export type Ring = Point[];
export type Polygon = Ring[];
export type BBox = [number, number, number, number];

/** Ray casting: is the point inside this ring? */
function inRing([x, y]: Point, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Inside the outer ring and in none of its holes. */
export function inPolygon(p: Point, polygon: Polygon): boolean {
  return inRing(p, polygon[0]) && !polygon.slice(1).some((hole) => inRing(p, hole));
}

export function inPolygons(p: Point, polygons: Polygon[]): boolean {
  return polygons.some((poly) => inPolygon(p, poly));
}

export function bboxOf(polygons: Polygon[]): BBox {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of polygons)
    for (const [x, y] of poly[0]) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  return [minX, minY, maxX, maxY];
}

export const inBBox = ([x, y]: Point, [minX, minY, maxX, maxY]: BBox) => x >= minX && x <= maxX && y >= minY && y <= maxY;

/** A point surely inside the largest polygon: its box centre if inside, else a grid search. */
export function interiorPoint(polygons: Polygon[]): Point {
  const poly = [...polygons].sort((a, b) => b[0].length - a[0].length)[0];
  const [minX, minY, maxX, maxY] = bboxOf([poly]);
  const centre: Point = [(minX + maxX) / 2, (minY + maxY) / 2];
  if (inPolygon(centre, poly)) return centre;
  for (let n = 4; n <= 128; n *= 2)
    for (let i = 1; i < n; i++)
      for (let j = 1; j < n; j++) {
        const p: Point = [minX + ((maxX - minX) * i) / n, minY + ((maxY - minY) * j) / n];
        if (inPolygon(p, poly)) return p;
      }
  return poly[0][0];
}

/** Sutherland–Hodgman against a horizontal line: keep the part south (below) or north (above) of `lat`. */
export function clipAtLatitude(polygons: Polygon[], lat: number, keep: 'south' | 'north'): Polygon[] {
  const inside = ([, y]: Point) => (keep === 'south' ? y < lat : y >= lat);
  const cross = ([x1, y1]: Point, [x2, y2]: Point): Point => [x1 + ((x2 - x1) * (lat - y1)) / (y2 - y1), lat];
  const clipRing = (ring: Ring): Ring => {
    const out: Ring = [];
    for (let i = 0; i < ring.length; i++) {
      const cur = ring[i];
      const prev = ring[(i + ring.length - 1) % ring.length];
      if (inside(cur)) {
        if (!inside(prev)) out.push(cross(prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(cross(prev, cur));
    }
    return out;
  };
  return polygons
    .map((poly) => poly.map(clipRing).filter((ring) => ring.length >= 4))
    .filter((poly) => poly.length > 0 && poly[0].length >= 4);
}
