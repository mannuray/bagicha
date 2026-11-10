import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PlantLedgerModule } from '../plant-ledger';
import { UserModule } from '../user';
import { WeatherProcessor } from './processors/weather.processor';
import { OverlayRepository } from './repositories/overlay.repository';
import { SeasonalPackRepository } from './repositories/seasonal-pack.repository';
import { SeasonalController } from './seasonal.controller';
import { SeasonalService, WEATHER_QUEUE } from './seasonal.service';
import { WeatherService } from './services/weather.service';

@Module({
  imports: [
    PlantLedgerModule,
    UserModule,
    BullModule.registerQueue({ name: WEATHER_QUEUE }),
  ],
  controllers: [SeasonalController],
  providers: [
    SeasonalService,
    WeatherService,
    WeatherProcessor,
    SeasonalPackRepository,
    OverlayRepository,
  ],
  exports: [SeasonalService],
})
export class SeasonalModule {}
