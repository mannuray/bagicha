import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../common/redis/redis.service';
import { CatalogueModule } from '../catalogue';
import { PlantLedgerModule } from '../plant-ledger';
import { RegionsModule } from '../regions';
import { buildProviders } from './providers/provider-config';
import { WeatherController } from './weather.controller';
import { WeatherAudienceRepository } from './weather-audience.repository';
import { WeatherForecasts } from './weather-forecasts';
import {
  WEATHER_REMINDER_QUEUE,
  WeatherReminderProcessor,
  WeatherReminderSchedule,
} from './weather-reminder.processor';
import { WeatherReminderService } from './weather-reminder.service';

/** Per-call limit before the next provider is tried. */
const PROVIDER_TIMEOUT_MS = 4000;

@Module({
  imports: [
    RegionsModule,
    CatalogueModule,
    PlantLedgerModule,
    BullModule.registerQueue({ name: WEATHER_REMINDER_QUEUE }),
  ],
  controllers: [WeatherController],
  providers: [
    WeatherAudienceRepository,
    WeatherReminderService,
    WeatherReminderSchedule,
    WeatherReminderProcessor,
    {
      provide: WeatherForecasts,
      inject: [ConfigService, RedisService, PinoLogger],
      useFactory: (
        config: ConfigService,
        redis: RedisService,
        logger: PinoLogger,
      ) => {
        logger.setContext(WeatherForecasts.name);
        const env = {
          WEATHER_PROVIDERS: config.get<string>('WEATHER_PROVIDERS'),
          OPEN_METEO_API_KEY: config.get<string>('OPEN_METEO_API_KEY'),
        };
        const providers = buildProviders(env, globalThis.fetch);
        if (
          config.get<string>('NODE_ENV') === 'production' &&
          providers.some((p) => p.name === 'Open-Meteo') &&
          !env.OPEN_METEO_API_KEY
        ) {
          logger.warn(
            'Open-Meteo is on its free, non-commercial API; set OPEN_METEO_API_KEY for commercial use',
          );
        }
        return new WeatherForecasts(
          providers,
          redis,
          logger,
          PROVIDER_TIMEOUT_MS,
        );
      },
    },
  ],
  exports: [WeatherForecasts],
})
export class WeatherModule {}
