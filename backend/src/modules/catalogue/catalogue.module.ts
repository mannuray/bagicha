import { Module } from '@nestjs/common';
import { CatalogueRepository } from './catalogue.repository';
import { CatalogueStore } from './catalogue.store';

/** The plant catalogue: its tables and, for readers, the loaded catalogue. */
@Module({
  providers: [CatalogueRepository, CatalogueStore],
  exports: [CatalogueRepository, CatalogueStore],
})
export class CatalogueModule {}
