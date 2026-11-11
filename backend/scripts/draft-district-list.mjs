// One-off helper (district-map plan, Task 1): prints "district<TAB>state<TAB>lng<TAB>lat"
// for every geoBoundaries ADM2 shape, the state found by testing a point inside the
// district against the ADM1 shapes. The output is hand-cleaned into districts.ts.
// Usage: node scripts/draft-district-list.mjs <adm2.geojson> <adm1.geojson>
import { readFileSync } from 'node:fs';

const [adm2Path, adm1Path] = process.argv.slice(2);
const adm2 = JSON.parse(readFileSync(adm2Path, 'utf8'));
const adm1 = JSON.parse(readFileSync(adm1Path, 'utf8'));

const polygonsOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const inRing = ([x, y], ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inPolygon = (p, rings) => inRing(p, rings[0]) && !rings.slice(1).some((h) => inRing(p, h));
const contains = (g, p) => polygonsOf(g).some((rings) => inPolygon(p, rings));

/** A point inside the largest polygon: its bbox centre if inside, else a grid search. */
function interiorPoint(g) {
  const rings = polygonsOf(g).sort((a, b) => b[0].length - a[0].length)[0];
  const xs = rings[0].map((c) => c[0]);
  const ys = rings[0].map((c) => c[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const centre = [(minX + maxX) / 2, (minY + maxY) / 2];
  if (inPolygon(centre, rings)) return centre;
  for (let n = 4; n <= 64; n *= 2)
    for (let i = 1; i < n; i++)
      for (let j = 1; j < n; j++) {
        const p = [minX + ((maxX - minX) * i) / n, minY + ((maxY - minY) * j) / n];
        if (inPolygon(p, rings)) return p;
      }
  return rings[0][0];
}

for (const f of adm2.features) {
  const p = interiorPoint(f.geometry);
  const state = adm1.features.find((s) => contains(s.geometry, p))?.properties.shapeName ?? '?';
  console.log([f.properties.shapeName.trim(), state, p[0].toFixed(3), p[1].toFixed(3)].join('\t'));
}
