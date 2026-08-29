import type { Destination } from '../data/destinations';
import type { WeatherAtmosphere } from '../hooks/useCurrentWeather';

const PARTICLES = Array.from({ length: 48 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + 11) % 101}%`,
  delay: `${-((index * 0.41) % 8)}s`,
  duration: `${5.5 + ((index * 0.67) % 5)}s`,
  drift: `${((index * 19) % 44) - 22}px`,
  size: `${2 + ((index * 7) % 5)}px`,
  opacity: 0.22 + ((index * 13) % 44) / 100,
}));

interface AtmosphereProps {
  destination: Destination;
  atmosphere?: WeatherAtmosphere;
  caption?: string;
}

export function Atmosphere({ destination, atmosphere, caption }: AtmosphereProps) {
  const currentAtmosphere = atmosphere ?? destination.atmosphere;
  const showParticles = currentAtmosphere !== 'clear' && currentAtmosphere !== 'cloudy';

  return (
    <div className={`atmosphere atmosphere--${currentAtmosphere}`} aria-hidden="true">
      <div className="atmosphere__haze" />
      {showParticles ? (
        <div className="atmosphere__particles">
          {PARTICLES.map((particle) => (
            <i
              className="atmosphere__particle"
              key={particle.id}
              style={{
                left: particle.left,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
                '--particle-drift': particle.drift,
                '--particle-size': particle.size,
                '--particle-opacity': particle.opacity,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ) : null}
      <p className="atmosphere__caption">{caption ?? destination.seasonNote}</p>
    </div>
  );
}
