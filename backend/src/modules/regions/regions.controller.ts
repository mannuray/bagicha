import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DISTRICTS } from './domain/districts';
import { districtLabel } from './domain/district-match';
import { DistrictLocator } from './district-locator';

/** India's lat/lng box: anything outside is answered with null without a lookup. */
const INDIA = { minLat: 6, maxLat: 38, minLng: 68, maxLng: 98 };

/** The selectable districts, built once: the type-ahead's source. */
const LIST = DISTRICTS.filter((d) => d.selectable !== false).map((d) => ({
  name: d.name,
  state: d.state,
  region: d.region,
  label: districtLabel(d),
  aliases: d.aliases,
}));

@Controller('regions')
@UseGuards(AuthGuard('jwt'))
export class RegionsController {
  constructor(private readonly locator: DistrictLocator) {}

  @Get('districts')
  districts() {
    return LIST;
  }

  /** The district at a point. The coordinates are not logged or stored here. */
  @Get('locate')
  locate(@Query('lat') latText: string, @Query('lng') lngText: string) {
    const lat = Number(latText);
    const lng = Number(lngText);
    if (
      !(
        lat >= INDIA.minLat &&
        lat <= INDIA.maxLat &&
        lng >= INDIA.minLng &&
        lng <= INDIA.maxLng
      )
    )
      return null;
    return this.locator.locate(lat, lng);
  }
}
