import { elizaLogger } from '../logger';

import { Provider, IAgentRuntime, Memory, elizaLogger } from '@elizaos/core';

type OpenMeteoArchiveResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly?: {
    time: string[]; // ISO strings
    temperature_2m?: number[];
    precipitation?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
  };
};

export type EnrichedWeather = {
  matchedTime: string; // ISO
  temperature_2m?: number;
  precipitation?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  conditions?: string;
};

const OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

function toISODateUTC(d: Date): string {
  // YYYY-MM-DD in UTC
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function closestIndex(times: string[], targetMs: number): number {
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = Date.parse(times[i]);
    const diff = Math.abs(t - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// Map Open-Meteo weather codes to conditions
function mapWeatherCode(code: number): string {
  const weatherCodes: { [key: number]: string } = {
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
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return weatherCodes[code] || 'Unknown';
}

export async function getHistoricalWeatherAtTimestamp(opts: {
  lat: number;
  lng: number;
  timestampISO: string; // e.g. "2025-02-07T23:27:43.000Z"
}): Promise<EnrichedWeather> {
  const ts = new Date(opts.timestampISO);
  const day = toISODateUTC(ts);

  const url = new URL(OPEN_METEO_ARCHIVE_URL);
  url.searchParams.set("latitude", String(opts.lat));
  url.searchParams.set("longitude", String(opts.lng));
  url.searchParams.set("start_date", day);
  url.searchParams.set("end_date", day);
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set(
    "hourly",
    "temperature_2m,precipitation,weather_code,wind_speed_10m"
  );

  elizaLogger.info('Fetching weather from Open-Meteo:', url.toString());

  const res = await fetch(url.toString(), {
    headers: { "accept": "application/json" },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Open-Meteo archive failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as OpenMeteoArchiveResponse;
  const hourly = data.hourly;

  if (!hourly?.time?.length) {
    throw new Error("Open-Meteo archive returned no hourly times");
  }

  const idx = closestIndex(hourly.time, ts.getTime());

  const weatherCode = hourly.weather_code?.[idx];
  const conditions = weatherCode !== undefined ? mapWeatherCode(weatherCode) : undefined;

  return {
    matchedTime: hourly.time[idx],
    temperature_2m: hourly.temperature_2m?.[idx],
    precipitation: hourly.precipitation?.[idx],
    weather_code: weatherCode,
    wind_speed_10m: hourly.wind_speed_10m?.[idx],
    conditions,
  };
}

export class OpenMeteoWeatherProvider implements Provider {
  name = 'WEATHER';
  description = 'Provides historical weather information using Open-Meteo (no API key required)';

  async get(runtime: IAgentRuntime, message: Memory): Promise<EnrichedWeather | null> {
    const content = message.content as any;
    
    // Check if we have location data
    if (!content?.location?.lat || !content?.location?.lng) {
      elizaLogger.info('No location data available for weather');
      return null;
    }

    // Get timestamp (use photo timestamp or current time)
    const timestamp = content.timestamp 
      ? new Date(content.timestamp).toISOString()
      : new Date().toISOString();

    elizaLogger.info('Getting weather data for location:', {
      lat: content.location.lat,
      lng: content.location.lng,
      timestamp
    });

    try {
      const weather = await getHistoricalWeatherAtTimestamp({
        lat: content.location.lat,
        lng: content.location.lng,
        timestampISO: timestamp
      });

      elizaLogger.info('Weather data retrieved:', weather);
      return weather;
    } catch (error) {
      elizaLogger.error('Error fetching weather data:', error);
      return null;
    }
  }
}
