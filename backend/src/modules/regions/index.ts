export { RegionsModule } from './regions.module';
export { DistrictLocator } from './district-locator';
export type { LocatedDistrict } from './district-locator';
export { DISTRICTS } from './domain/districts';
export type { District } from './domain/districts';
export {
  districtLabel,
  matchDistrict,
  regionForDistrict,
} from './domain/district-match';
export { regionFor, resolveRegionCluster } from './domain/region-cluster';
