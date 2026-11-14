import { Module } from '@nestjs/common';
import { CatalogueRepository } from './catalogue.repository';

/** The plant catalogue: its tables and, for readers, the loaded catalogue. */
@Module({
  providers: [CatalogueRepository],
  exports: [CatalogueRepository],
})
export class CatalogueModule {}
