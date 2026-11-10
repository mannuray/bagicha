import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../../common/redis/redis.service';
import { WeatherService } from '../services/weather.service';
import { WeatherProcessor } from './weather.processor';

function build(cached: string | null) {
  const weather = {
    getWeather: jest.fn(() =>
      Promise.resolve({ temp: 30, condition: 'Sunny', is_extreme: false }),
    ),
  };
  const redis = { get: jest.fn(() => Promise.resolve(cached)), set: jest.fn() };
  const processor = new WeatherProcessor(
    weather as unknown as WeatherService,
    redis as unknown as RedisService,
    { info: jest.fn(), warn: jest.fn() } as unknown as PinoLogger,
  );
  return { processor, weather, redis };
}

describe('WeatherProcessor', () => {
  it('skips the fetch when the pincode is already cached (safe to retry)', async () => {
    const { processor, weather, redis } = build('{"temp":31}');
    await processor.process({ data: { pincode: '800001' } } as Job);
    expect(weather.getWeather).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('fetches and caches on a miss', async () => {
    const { processor, weather, redis } = build(null);
    await processor.process({ data: { pincode: '800001' } } as Job);
    expect(weather.getWeather).toHaveBeenCalledWith('800001');
    expect(redis.set).toHaveBeenCalledWith(
      'weather:800001',
      expect.any(String),
      3600,
    );
  });
});
