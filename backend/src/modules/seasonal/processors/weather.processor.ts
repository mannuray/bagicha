import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WeatherService } from '../services/weather.service';
import { RedisService } from '../../../common/redis/redis.service';

@Processor('weather-checks')
export class WeatherProcessor extends WorkerHost {
  constructor(
    private weatherService: WeatherService,
    private redisService: RedisService,
    @InjectPinoLogger(WeatherProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { pincode } = job.data;

    this.logger.info({ pincode }, 'Checking weather');

    const weather = await this.weatherService.getWeather(pincode);

    // Cache the result in Redis for 1 hour
    await this.redisService.set(
      `weather:${pincode}`,
      JSON.stringify(weather),
      3600,
    );

    if (weather.is_extreme) {
      this.logger.warn(
        { pincode, alert: weather.alert_message },
        'Extreme weather detected',
      );
      // In a real app, we would trigger FCM push notifications here
    }

    return weather;
  }
}
