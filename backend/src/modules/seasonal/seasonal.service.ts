import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WeatherService } from './services/weather.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class SeasonalService {
  constructor(
    @InjectQueue('weather-checks') private weatherQueue: Queue,
    private weatherService: WeatherService,
    private redisService: RedisService,
  ) {}

  async getLocalizedWeather(pincode: string) {
    // Check cache first
    const cached = await this.redisService.get(`weather:${pincode}`);
    if (cached) return JSON.parse(cached);

    // If not cached, trigger a background job to fetch and cache
    await this.weatherQueue.add('check', { pincode });
    
    // Fallback to direct fetch for immediate response if cache is empty
    return this.weatherService.getWeather(pincode);
  }

  async getSeasonalGuide(district: string) {
    return this.weatherService.getSeasonalSuggestions(district);
  }
}
