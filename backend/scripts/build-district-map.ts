/**
 * One-time build (district-map plan, Task 2): geoBoundaries 2021 district shapes
 * → src/modules/regions/data/district-boundaries.json, simplified and linked to the
 * district list. Run by a developer; the output is committed.
 *
 *   npx ts-node -T scripts/build-district-map.ts <adm2.geojson> <adm1.geojson> [simplify%]
 *
 * Use the FULL-resolution ADM2 file: the "simplified" one drops most Lakshadweep
 * islands and enclave detail (Yanam).
 *
 * Simplification uses mapshaper through npx (not a project dependency).
 * Source: geoBoundaries IND ADM2 release 9469f09, ODbL 1.0 (spec §2.2).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { linkShape } from '../src/modules/regions/domain/link-shapes';
import { bboxOf, clipAtLatitude, inPolygons, interiorPoint, type Polygon } from '../src/modules/regions/domain/geometry';

type Geometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
type Feature = { properties: { shapeName: string }; geometry: Geometry };

const OUT = join(__dirname, '../src/modules/regions/data/district-boundaries.json');
const MAX_BYTES = 1.5 * 1024 * 1024;
const polygonsOf = (g: Geometry): Polygon[] => (g.type === 'Polygon' ? [g.coordinates as Polygon] : (g.coordinates as Polygon[]));

const [adm2Path, adm1Path, percent = '1.5%'] = process.argv.slice(2);
if (!adm2Path || !adm1Path) throw new Error('Usage: build-district-map.ts <adm2.geojson> <adm1.geojson> [simplify%]');
const simplified = join(mkdtempSync(join(tmpdir(), 'districts-')), 'adm2.json');
execFileSync('npx', ['-y', 'mapshaper@0.6.102', adm2Path, '-simplify', percent, 'keep-shapes', '-o', 'precision=0.0001', 'format=geojson', simplified], { stdio: 'inherit' });

const states = (JSON.parse(readFileSync(adm1Path, 'utf8')) as { features: Feature[] }).features.map((f) => ({
  name: f.properties.shapeName,
  polygons: polygonsOf(f.geometry),
}));
const stateAt = (p: [number, number]) => states.find((s) => inPolygons(p, s.polygons))?.name ?? '?';

const out = new Map<string, { name: string; state: string; polygons: Polygon[] }>();
const unknown: string[] = [];
const add = (shapeName: string, polygons: Polygon[]) => {
  if (!polygons.length) return;
  const [lng, lat] = interiorPoint(polygons);
  const district = linkShape({ name: shapeName, state: stateAt([lng, lat]), lng, lat });
  if (!district) return unknown.push(`${shapeName} (${stateAt([lng, lat])})`);
  const key = `${district.name}|${district.state}`;
  const entry = out.get(key) ?? { name: district.name, state: district.state, polygons: [] };
  entry.polygons.push(...polygons);
  out.set(key, entry);
};

// Simplifying can drop whole islands from a district (Lakshadweep's 23 become 4):
// each dropped island comes back with its original outline, rounded like the rest.
const round = (polygons: Polygon[]): Polygon[] =>
  polygons.map((poly) => poly.map((ring) => ring.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4])));
const originals = (JSON.parse(readFileSync(adm2Path, 'utf8')) as { features: Feature[] }).features;

for (const [index, f] of (JSON.parse(readFileSync(simplified, 'utf8')) as { features: Feature[] }).features.entries()) {
  const original = polygonsOf(originals[index].geometry);
  const kept = polygonsOf(f.geometry);
  const dropped = original.filter((poly) => !inPolygons(interiorPoint([poly]), kept));
  const polygons = dropped.length ? [...kept, ...round(dropped)] : kept;
  if (f.properties.shapeName.trim() === 'DATA NOT AVAILABLE') {
    // Spec §2.5.4: treated as India — PoK (J&K) south of 35°N, Gilgit-Baltistan (Ladakh) north of it.
    add(f.properties.shapeName, clipAtLatitude(polygons, 35, 'south'));
    add(f.properties.shapeName, clipAtLatitude(polygons, 35, 'north'));
  } else add(f.properties.shapeName, polygons);
}
if (unknown.length) throw new Error(`Shapes with no district in the list (add aliases):\n${unknown.join('\n')}`);

const districts = [...out.values()].map((d) => ({ ...d, bbox: bboxOf(d.polygons) }));
writeFileSync(
  OUT,
  JSON.stringify({ source: 'geoBoundaries IND ADM2 (2021), release 9469f09', licence: 'ODbL 1.0', districts }),
);
const bytes = statSync(OUT).size;
console.log(`${districts.length} districts, ${(bytes / 1024 / 1024).toFixed(2)} MB → ${OUT}`);
if (bytes > MAX_BYTES) throw new Error(`Boundary file is over 1.5 MB (${bytes} bytes); simplify more.`);
