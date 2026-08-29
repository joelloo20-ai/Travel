import { useEffect, useState } from 'react';

export type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';

export interface LiveWeather {
  condition: WeatherCondition;
  temperatureC: number;
  windKph: number;
  windDirectionDeg: number;
  cloudCoverPct: number;
  precipitationMm: number;
  humidityPct: number;
  isDay: boolean;
  fetchedAt: number;
}

interface WeatherState {
  weather: LiveWeather | null;
  loading: boolean;
  error: boolean;
}

const REFRESH_MS = 10 * 60 * 1000;

/** Maps Open-Meteo's WMO weather codes to a small condition set our scenes render. */
function conditionFromWmoCode(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'clear';
}

async function fetchWeather(latitude: number, longitude: number, signal: AbortSignal): Promise<LiveWeather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set(
    'current',
    'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation,relative_humidity_2m,is_day',
  );
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
  const data = await response.json();
  const current = data.current;

  return {
    condition: conditionFromWmoCode(current.weather_code),
    temperatureC: current.temperature_2m,
    windKph: current.wind_speed_10m,
    windDirectionDeg: current.wind_direction_10m,
    cloudCoverPct: current.cloud_cover,
    precipitationMm: current.precipitation,
    humidityPct: current.relative_humidity_2m,
    isDay: current.is_day === 1,
    fetchedAt: Date.now(),
  };
}

/**
 * Live current weather for a coordinate, from Open-Meteo (no API key required).
 * Polls every 10 minutes; on failure it keeps the last good reading rather than
 * tearing down the scene, so a flaky network never blanks the visuals.
 */
export function useLiveWeather(latitude: number, longitude: number): WeatherState {
  const [state, setState] = useState<WeatherState>({ weather: null, loading: true, error: false });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const weather = await fetchWeather(latitude, longitude, controller.signal);
        if (!cancelled) setState({ weather, loading: false, error: false });
      } catch {
        if (!cancelled) {
          setState((prev) => ({ weather: prev.weather, loading: false, error: true }));
        }
      } finally {
        if (!cancelled) timer = setTimeout(tick, REFRESH_MS);
      }
    }

    tick();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [latitude, longitude]);

  return state;
}
