import { Injectable } from '@nestjs/common';
import { CatalogueStore } from '../../catalogue';
import { SpeciesResolver } from '../domain/species-resolver';

/** Hands out species resolvers bound to the current plant catalogue. */
@Injectable()
export class SpeciesNormalizationService {
  constructor(private readonly catalogue: CatalogueStore) {}

  async resolver(): Promise<SpeciesResolver> {
    return new SpeciesResolver(await this.catalogue.snapshot());
  }
}
