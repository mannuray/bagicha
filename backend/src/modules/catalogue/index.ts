/** Public surface of the plant catalogue. Sibling modules import only from here. */
export { CatalogueModule } from './catalogue.module';
export { CatalogueStore, CatalogueUnavailableError } from './catalogue.store';
export { Catalogue, UnknownMethodError } from './domain/catalogue';
export { validateSeed } from './domain/schemas';
export { pick } from './domain/pick';
export { CATALOGUE_SEED } from './seed';
export { CARE_PENDING } from './seed/tree-care';
export { careForTree } from './domain/care-kind';
export type { TreeWords } from './domain/care-kind';
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
export type {
  Anchor,
  CareKind,
  CareStage,
  Dose,
  DosePart,
  FamilyCare,
  MonthDay,
  PhaseWindow,
  RegionCare,
  TreeCareCategory,
  TreeCareItem,
  TreeCareSeed,
} from './domain/tree-care';
export type { SeasonGuideSeed, SeasonMonth } from './domain/season-guide';
