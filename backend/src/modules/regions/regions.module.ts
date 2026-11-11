import { Module } from '@nestjs/common';
import { DistrictLocator } from './district-locator';
import { RegionsController } from './regions.controller';

/** Indian districts: the full list with regions, and the district at a location. */
@Module({
  controllers: [RegionsController],
  // Built by hand: its only constructor argument is a file reader that tests swap out.
  providers: [
    { provide: DistrictLocator, useFactory: () => new DistrictLocator() },
  ],
  exports: [DistrictLocator],
})
export class RegionsModule {}
