/** Public surface of the plant catalogue. Sibling modules import only from here. */
export { CatalogueModule } from './catalogue.module';
export { Catalogue, UnknownMethodError } from './domain/catalogue';
export { validateSeed } from './domain/schemas';
export { CATALOGUE_SEED } from './seed';
export type {
  CareStep,
  CareStepInfo,
  CatalogueSeed,
  CatalogueStatus,
  ClimateGroup,
  CropInfo,
  CropSeed,
  CropTag,
  Journey,
  MethodSeed,
  CareStepSeed,
  Months,
  PlantingMethod,
} from './domain/types';
