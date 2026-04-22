import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WeatherData {
  temp: number;
  condition: string;
  is_extreme: boolean;
  alert_message?: string;
}

@Injectable()
export class WeatherService {
  constructor(private configService: ConfigService) {}

  /**
   * Fetches weather data for a specific pincode.
   * Currently mocked, but designed to integrate with OpenWeatherMap or similar.
   */
  async getWeather(pincode: string): Promise<WeatherData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock logic for Indian context (e.g., Bihar/UP heatwaves)
    const mockTemp = 32 + Math.floor(Math.random() * 15); // 32°C to 47°C
    const isExtreme = mockTemp > 42;

    return {
      temp: mockTemp,
      condition: mockTemp > 40 ? 'Sunny & Harsh' : 'Sunny',
      is_extreme: isExtreme,
      alert_message: isExtreme 
        ? `Extreme heat detected (${mockTemp}°C). Please deep-water your citrus and mango trees tonight.` 
        : undefined,
    };
  }

  async getSeasonalSuggestions(district: string) {
    // Simple seasonal mapping for India
    const month = new Date().getMonth(); // 0-11
    
    if (month >= 2 && month <= 5) {
      return {
        season: 'Summer',
        crops: ['Okra', 'Cucumber', 'Bitter Gourd', 'Bottle Gourd', 'Pumpkin'],
        advice: 'Focus on mulching and consistent evening watering.',
      };
    } else if (month >= 6 && month <= 9) {
      return {
        season: 'Monsoon',
        crops: ['Corn', 'Radish', 'Beans', 'Chilli'],
        advice: 'Ensure proper drainage to prevent root rot in fruit trees.',
      };
    } else {
      return {
        season: 'Winter',
        crops: ['Peas', 'Carrots', 'Cauliflower', 'Spinach', 'Mustard'],
        advice: 'Protect young saplings from morning frost.',
      };
    }
  }
}
