import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RegionCluster } from '@prisma/client';
import { DISTRICTS } from './domain/districts';
import { districtLabel } from './domain/district-match';
import { inBBox, inPolygons, type BBox, type Polygon } from './domain/geometry';

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
    const shape = this.load().find(
      (s) => inBBox(point, s.bbox) && inPolygons(point, s.polygons),
    );
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

  private load(): Shape[] {
    this.shapes ??= (
      JSON.parse(this.read(BOUNDARIES)) as { districts: Shape[] }
    ).districts;
    return this.shapes;
  }
}
