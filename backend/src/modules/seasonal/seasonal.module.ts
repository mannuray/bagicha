import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SeasonalService } from './seasonal.service';
import { SeasonalController } from './seasonal.controller';
import { WeatherService } from './services/weather.service';
import { WeatherProcessor } from './processors/weather.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'weather-checks',
    }),
  ],
  controllers: [SeasonalController],
  providers: [SeasonalService, WeatherService, WeatherProcessor],
  exports: [SeasonalService],
})
export class SeasonalModule {}
