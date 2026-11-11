import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RegionCluster } from '@prisma/client';
import { DISTRICTS } from './domain/districts';
import { districtLabel } from './domain/district-match';
import {
  distanceKm,
  growBBox,
  inBBox,
  inPolygons,
  type BBox,
  type Polygon,
} from './domain/geometry';

interface Shape {
  name: string;
  state: string;
  bbox: BBox;
  polygons: Polygon[];
}

export interface LocatedDistrict {
  district: string;
  state: string;
  region: RegionCluster;
  label: string;
}

const BOUNDARIES = join(__dirname, 'data', 'district-boundaries.json');
/** Simplified coastlines and tiny islands can miss a real point by a little: take the nearest shape this close. */
const NEAREST_KM = 15;

/**
 * Which district a point lies in (geoBoundaries 2021 shapes, built by
 * scripts/build-district-map.ts). The 0.6 MB file loads on first use, once.
 */
export class DistrictLocator {
  private shapes: Shape[] | null = null;

  constructor(
    private readonly read: (path: string) => string = (p) =>
      readFileSync(p, 'utf8'),
  ) {}

  locate(lat: number, lng: number): LocatedDistrict | null {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const point: [number, number] = [lng, lat];
    const shapes = this.load();
    const shape =
      shapes.find(
        (s) => inBBox(point, s.bbox) && inPolygons(point, s.polygons),
      ) ?? this.nearest(shapes, point);
    const district =
      shape &&
      DISTRICTS.find((d) => d.name === shape.name && d.state === shape.state);
    if (!district) return null;
    return {
      district: district.name,
      state: district.state,
      region: district.region,
      label: districtLabel(district),
    };
  }

  private nearest(shapes: Shape[], point: [number, number]): Shape | undefined {
    let best: { shape: Shape; km: number } | undefined;
    for (const s of shapes) {
      if (!inBBox(point, growBBox(s.bbox, NEAREST_KM))) continue;
      const km = distanceKm(point, s.polygons);
      if (km <= NEAREST_KM && (!best || km < best.km)) best = { shape: s, km };
    }
    return best?.shape;
  }

  private load(): Shape[] {
    this.shapes ??= (
      JSON.parse(this.read(BOUNDARIES)) as { districts: Shape[] }
    ).districts;
    return this.shapes;
  }
}
