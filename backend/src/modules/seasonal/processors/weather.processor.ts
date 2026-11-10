import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../../common/redis/redis.service';
import { WeatherData, WeatherService } from '../services/weather.service';

const CACHE_TTL_SECONDS = 3600;

/** Refreshes the cached weather for a pincode. A retry finds the cache warm and does nothing. */
@Processor('weather-checks')
export class WeatherProcessor extends WorkerHost {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly redis: RedisService,
    @InjectPinoLogger(WeatherProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async process(job: Job<{ pincode: string }>): Promise<WeatherData | null> {
    const { pincode } = job.data;
    const key = `weather:${pincode}`;
    if (await this.redis.get(key)) {
      this.logger.info({ pincode }, 'Weather already cached; skipping');
      return null;
    }

    this.logger.info({ pincode }, 'Checking weather');
    const weather = await this.weatherService.getWeather(pincode);
    await this.redis.set(key, JSON.stringify(weather), CACHE_TTL_SECONDS);
    if (weather.is_extreme) {
      // Push notifications (FCM) will hook in here.
      this.logger.warn(
        { pincode, alert: weather.alert_message },
        'Extreme weather detected',
      );
    }
    return weather;
  }
}
