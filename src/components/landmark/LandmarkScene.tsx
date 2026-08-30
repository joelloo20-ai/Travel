import type { Destination } from '../../data/destinations';
import type { LiveWeather } from '../../hooks/useLiveWeather';
import type { LocalTimeState } from '../../hooks/useLocalTime';
import { CinematicLandmarkScene } from './CinematicLandmarkScene';

export interface LandmarkSceneProps {
  destination: Destination;
  weather: LiveWeather | null;
  localTime: LocalTimeState;
  loading: boolean;
}

/**
 * Destination artwork is deliberately a 2D film plate, rather than a generic
 * WebGL approximation. That keeps the landmark architecturally recognisable
 * and reserves the runtime budget for smooth, layered motion.
 */
export function LandmarkScene({ destination, weather, localTime, loading }: LandmarkSceneProps) {
  return <CinematicLandmarkScene destination={destination} weather={weather} localTime={localTime} loading={loading} />;
}
