import { useEffect, useRef, useState } from 'react';

export interface LocalTimeState {
  /** Formatted local clock, e.g. "14:32". */
  clock: string;
  /** Local hour of day as a float, e.g. 14.53. */
  hour: number;
  /** Sun elevation proxy: -1 (midnight) .. 0 (horizon) .. 1 (noon). */
  sunElevation: number;
  /** 0 = full night, 1 = full day, smoothly blended across dawn/dusk. */
  dayPhase: number;
  /** 0..1, peaks right at sunrise/sunset for warm horizon color grading. */
  goldenPhase: number;
  isDaytime: boolean;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function computeLocalTime(timezone: string): LocalTimeState {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hourPart = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minutePart = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  const hour = (hourPart % 24) + minutePart / 60;

  const sunElevation = Math.sin(((hour - 6) / 12) * Math.PI);
  const dayPhase = smoothstep(-0.15, 0.15, sunElevation);
  const goldenPhase = 1 - Math.min(Math.abs(sunElevation) / 0.35, 1);

  const clock = `${String(hourPart).padStart(2, '0')}:${String(minutePart).padStart(2, '0')}`;

  return { clock, hour, sunElevation, dayPhase, goldenPhase, isDaytime: dayPhase > 0.5 };
}

/** Live local time + a smooth day/night blend for a city, from its IANA timezone. */
export function useLocalTime(timezone: string): LocalTimeState {
  const [state, setState] = useState(() => computeLocalTime(timezone));
  const mountedTimezone = useRef(timezone);

  useEffect(() => {
    // The lazy initializer above already covers the first render; only a later
    // timezone change (navigating to a different city) needs an immediate refresh.
    if (mountedTimezone.current !== timezone) {
      mountedTimezone.current = timezone;
      setState(computeLocalTime(timezone));
    }
    const interval = setInterval(() => setState(computeLocalTime(timezone)), 30_000);
    return () => clearInterval(interval);
  }, [timezone]);

  return state;
}
