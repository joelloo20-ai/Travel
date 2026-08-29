import { useEffect, useState } from 'react';

export type WeatherAtmosphere = 'clear' | 'cloudy' | 'rain' | 'snow' | 'mist' | 'wind' | 'storm';

export interface CurrentWeather {
  atmosphere: WeatherAtmosphere;
  condition: string;
  temperature: number;
  windSpeed: number;
  isDaytime: boolean;
  observedAt: string;
}

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
  };
}

function weatherPresentation(code: number, windSpeed: number): Pick<CurrentWeather, 'atmosphere' | 'condition'> {
  if (code === 0) return { atmosphere: 'clear', condition: 'Clear skies' };
  if (code <= 3) return { atmosphere: 'cloudy', condition: code === 1 ? 'Mostly clear' : 'Cloudy' };
  if (code === 45 || code === 48) return { atmosphere: 'mist', condition: 'Foggy' };
  if (code >= 51 && code <= 67) return { atmosphere: 'rain', condition: code >= 65 ? 'Heavy rain' : 'Rain' };
  if (code >= 71 && code <= 77) return { atmosphere: 'snow', condition: 'Snow' };
  if (code >= 80 && code <= 82) return { atmosphere: 'rain', condition: code === 82 ? 'Heavy showers' : 'Rain showers' };
  if (code >= 85 && code <= 86) return { atmosphere: 'snow', condition: 'Snow showers' };
  if (code >= 95) return { atmosphere: 'storm', condition: 'Thunderstorm' };
  if (windSpeed >= 30) return { atmosphere: 'wind', condition: 'Windy' };
  return { atmosphere: 'cloudy', condition: 'Current conditions' };
}

export function useCurrentWeather(latitude: number, longitude: number) {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      try {
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          current: 'temperature_2m,weather_code,is_day,wind_speed_10m',
          timezone: 'auto',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Weather request failed');

        const data = (await response.json()) as OpenMeteoResponse;
        if (!data.current) throw new Error('Weather data is unavailable');

        const current = data.current;
        setWeather({
          ...weatherPresentation(current.weather_code, current.wind_speed_10m),
          temperature: Math.round(current.temperature_2m),
          windSpeed: Math.round(current.wind_speed_10m),
          isDaytime: current.is_day === 1,
          observedAt: current.time,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setWeather(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    setIsLoading(true);
    setWeather(null);
    void loadWeather();
    const refreshId = window.setInterval(loadWeather, 15 * 60 * 1000);

    return () => {
      controller.abort();
      window.clearInterval(refreshId);
    };
  }, [latitude, longitude]);

  return { weather, isLoading };
}
