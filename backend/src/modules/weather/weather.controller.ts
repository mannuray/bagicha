import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthedRequest } from '../../common/auth/authed-request';
import { DistrictLocator } from '../regions';
import { weatherPlace } from './domain/weather-place';
import { WeatherForecasts } from './weather-forecasts';
import { NO_WEATHER, toWeatherView, type WeatherView } from './weather-view';

@Controller('weather')
@UseGuards(AuthGuard('jwt'))
export class WeatherController {
  constructor(
    private readonly forecasts: WeatherForecasts,
    private readonly locator: DistrictLocator,
  ) {}

  /** Weather for the signed-in user's place; `weather: null` hides the card. */
  @Get()
  async current(@Request() req: AuthedRequest): Promise<WeatherView> {
    const cell = weatherPlace(req.user, this.locator);
    if (!cell) return NO_WEATHER;
    return toWeatherView(await this.forecasts.forCell(cell));
  }
}
