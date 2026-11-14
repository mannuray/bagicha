/** Public surface of the plant catalogue. Sibling modules import only from here. */
export { CatalogueModule } from './catalogue.module';
export { CatalogueStore, CatalogueUnavailableError } from './catalogue.store';
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
  CareCategory,
  CareItem,
  FruitPlantInfo,
  FruitPlantSeed,
  FruitTypeInfo,
  FruitTypeSeed,
  LifeProfile,
  Months,
  PerennialFlower,
  PerennialFlowerSeed,
  PlantingMethod,
  SearchEntry,
} from './domain/types';
