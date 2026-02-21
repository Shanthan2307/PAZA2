import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';
import { elizaLogger } from '@elizaos/core';

export class ImageAnalysisProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyze(imageDataUrl: string): Promise<any> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageDataUrl.split(',')[1]
              }
            },
            {
              type: 'text',
              text: 'Analyze this image and provide: 1) A detailed description, 2) List of objects, 3) Landmarks if any, 4) Categories, 5) Tags, 6) Confidence score (0-100)'
            }
          ]
        }]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        description: text,
        objects: [],
        landmarks: [],
        categories: [],
        tags: [],
        confidence: 85
      };
    } catch (error) {
      elizaLogger.error('Image analysis error:', error);
      throw error;
    }
  }
}

export class LocationProvider {
  async getLocation(coordinates: { lat: number; lng: number }): Promise<any> {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}`,
        {
          headers: {
            'User-Agent': 'Paze/1.0'
          }
        }
      );

      const data = response.data;
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state,
        country: data.address?.country,
        coordinates
      };
    } catch (error) {
      elizaLogger.error('Location lookup error:', error);
      return null;
    }
  }
}

export class WeatherProvider {
  async getWeather(coordinates: { lat: number; lng: number }, timestamp: Date): Promise<any> {
    try {
      const date = timestamp.toISOString().split('T')[0];
      const response = await axios.get(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${coordinates.lat}&longitude=${coordinates.lng}&start_date=${date}&end_date=${date}&hourly=temperature_2m,precipitation,weather_code,wind_speed_10m`
      );

      const data = response.data;
      if (data.hourly) {
        const hour = timestamp.getHours();
        return {
          temperature_2m: data.hourly.temperature_2m[hour],
          precipitation: data.hourly.precipitation[hour],
          weather_code: data.hourly.weather_code[hour],
          wind_speed_10m: data.hourly.wind_speed_10m[hour],
          conditions: this.getWeatherCondition(data.hourly.weather_code[hour])
        };
      }
      return null;
    } catch (error) {
      elizaLogger.error('Weather lookup error:', error);
      return null;
    }
  }

  private getWeatherCondition(code: number): string {
    const conditions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm'
    };
    return conditions[code] || 'Unknown';
  }
}

export class NewsProvider {
  async getNews(location: any): Promise<any> {
    try {
      const query = `${location.city || ''} ${location.state || ''} ${location.country || ''}`.trim();
      const response = await axios.get(
        `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=10&format=json`
      );

      return response.data.articles || [];
    } catch (error) {
      elizaLogger.error('News lookup error:', error);
      return [];
    }
  }
}
