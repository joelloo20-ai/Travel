import type { Destination } from '../../data/destinations';
import type { LocalTimeState } from '../../hooks/useLocalTime';

interface LandmarkStaticFallbackProps {
  destination: Destination;
  localTime: LocalTimeState;
  loading?: boolean;
}

/** Non-WebGL fallback for the landmark scene: reduced motion, narrow viewport, or WebGL failure. */
export function LandmarkStaticFallback({ destination, localTime, loading }: LandmarkStaticFallbackProps) {
  return (
    <div
      className="landmark-fallback"
      style={{
        background: `radial-gradient(120% 100% at 50% 20%, ${destination.sky}66, transparent 65%), linear-gradient(180deg, ${destination.deep}, #061b1d 90%)`,
      }}
    >
      <div className="landmark-fallback__ring" style={{ borderColor: `${destination.accent}55` }} />
      <p className="landmark-fallback__caption">
        {loading ? 'Loading the live scene' : `${destination.landmarkName} · Stylised view · ${localTime.clock} local`}
      </p>
    </div>
  );
}
