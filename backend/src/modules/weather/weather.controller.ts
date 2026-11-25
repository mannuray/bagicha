import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthedRequest } from '../../common/auth/authed-request';
import { RequestLang, type Lang } from '../../common/http/lang';
import { CatalogueStore } from '../catalogue';
import { DistrictLocator, regionFor } from '../regions';
import { weatherAdviceKeys } from './domain/weather-advice';
import { weatherEvents } from './domain/weather-events';
import { weatherPlace } from './domain/weather-place';
import { WeatherForecasts } from './weather-forecasts';
import { NO_WEATHER, toWeatherView, type WeatherView } from './weather-view';

@Controller('weather')
@UseGuards(AuthGuard('jwt'))
export class WeatherController {
  constructor(
    private readonly forecasts: WeatherForecasts,
    private readonly locator: DistrictLocator,
    private readonly catalogue: CatalogueStore,
  ) {}

  /** Weather for the signed-in user's place, with a tip when the weather calls for one; `weather: null` hides the card. */
  @Get()
  async current(
    @Request() req: AuthedRequest,
    @RequestLang() lang: Lang,
  ): Promise<WeatherView> {
    const cell = weatherPlace(req.user, this.locator);
    if (!cell) return NO_WEATHER;
    const sourced = await this.forecasts.forCell(cell);
    if (!sourced) return NO_WEATHER;
    const [first] = weatherEvents(sourced.forecast, {
      hills: regionFor(req.user) === 'HILLS_COOL',
    });
    const tip = first
      ? (await this.catalogue.snapshot()).advice(
          { key: weatherAdviceKeys(first.kind).tip },
          lang,
        )
      : null;
    return toWeatherView(sourced, tip);
  }
}
