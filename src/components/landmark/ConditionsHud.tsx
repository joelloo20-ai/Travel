import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Moon, Sun, Wind } from 'lucide-react';
import type { LiveWeather, WeatherCondition } from '../../hooks/useLiveWeather';
import type { LocalTimeState } from '../../hooks/useLocalTime';

const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  drizzle: 'Drizzle',
  rain: 'Raining',
  snow: 'Snowing',
  thunderstorm: 'Thunderstorm',
};

function ConditionIcon({ condition, isDay }: { condition: WeatherCondition; isDay: boolean }) {
  const size = 18;
  if (condition === 'clear') return isDay ? <Sun size={size} /> : <Moon size={size} />;
  if (condition === 'cloudy') return <Cloud size={size} />;
  if (condition === 'fog') return <CloudFog size={size} />;
  if (condition === 'drizzle') return <CloudDrizzle size={size} />;
  if (condition === 'rain') return <CloudRain size={size} />;
  if (condition === 'snow') return <CloudSnow size={size} />;
  return <CloudLightning size={size} />;
}

interface ConditionsHudProps {
  weather: LiveWeather | null;
  weatherLoading: boolean;
  weatherError: boolean;
  localTime: LocalTimeState;
  accent: string;
}

export function ConditionsHud({ weather, weatherLoading, weatherError, localTime, accent }: ConditionsHudProps) {
  return (
    <div className="conditions-hud">
      <div className="conditions-hud__row">
        <span className="conditions-hud__clock" style={{ color: accent }}>
          {localTime.clock}
        </span>
        <span className="conditions-hud__daynight">{localTime.isDaytime ? 'Day' : 'Night'} · local time</span>
      </div>
      <div className="conditions-hud__divider" />
      {weather ? (
        <div className="conditions-hud__row conditions-hud__weather">
          <ConditionIcon condition={weather.condition} isDay={weather.isDay} />
          <span className="conditions-hud__temp">{Math.round(weather.temperatureC)}°C</span>
          <span className="conditions-hud__condition">{CONDITION_LABEL[weather.condition]}</span>
          <span className="conditions-hud__wind">
            <Wind size={13} />
            {Math.round(weather.windKph)} km/h
          </span>
        </div>
      ) : (
        <div className="conditions-hud__row conditions-hud__weather">
          <span className="conditions-hud__condition">
            {weatherLoading ? 'Fetching live conditions…' : weatherError ? 'Live conditions unavailable' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
