import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WeatherService } from '../services/weather.service';
import { RedisService } from '../../../common/redis/redis.service';

@Processor('weather-checks')
export class WeatherProcessor extends WorkerHost {
  constructor(
    private weatherService: WeatherService,
    private redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { pincode } = job.data;

    console.log(`[PROCESSOR] Checking weather for pincode: ${pincode}`);

    const weather = await this.weatherService.getWeather(pincode);

    // Cache the result in Redis for 1 hour
    await this.redisService.set(
      `weather:${pincode}`,
      JSON.stringify(weather),
      3600,
    );

    if (weather.is_extreme) {
      console.log(
        `[ALERT] Extreme weather in ${pincode}: ${weather.alert_message}`,
      );
      // In a real app, we would trigger FCM push notifications here
    }

    return weather;
  }
}
