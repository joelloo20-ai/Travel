import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Compass, MapPin, Tag, Wind } from 'lucide-react';
import { destinationByKey } from '../data/destinations';
import { CinematicCityScene } from '../components/CinematicCityScene';
import { TripPlannerModal } from '../components/TripPlannerModal';
import { useCurrentWeather, type WeatherAtmosphere } from '../hooks/useCurrentWeather';
import { upsertTrip } from '../lib/tripStore';

const weatherIconByAtmosphere: Record<WeatherAtmosphere, typeof Cloud> = {
  clear: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: CloudSnow,
  mist: CloudFog,
  wind: Wind,
};

export function DestinationDetail() {
  const { key } = useParams<{ key: string }>();
  const destination = key ? destinationByKey(key) : undefined;
  const [added, setAdded] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const { weather, isLoading } = useCurrentWeather(destination?.latitude ?? 0, destination?.longitude ?? 0);

  if (!destination) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className="destination-detail destination-detail--night"
      style={{
        background: `radial-gradient(120% 120% at 20% 0%, ${destination.sky}55, transparent 60%), linear-gradient(180deg, ${destination.deep}, #061b1d 85%)`,
      }}
    >
      <div className="grain-overlay" aria-hidden="true" />
      <CinematicCityScene destination={destination} isDaytime={weather?.isDaytime} atmosphere={weather?.atmosphere} />
      <Link to="/" className="detail-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Globe
      </Link>

      <div className="detail-coordinates">
        <MapPin size={13} aria-hidden="true" />
        {destination.latitude.toFixed(4)}° {destination.latitude >= 0 ? 'N' : 'S'},{' '}
        {destination.longitude.toFixed(4)}° {destination.longitude >= 0 ? 'E' : 'W'}
      </div>

      <div className="detail-content">
        <p className="destination-eyebrow" style={{ color: destination.accent }}>
          {destination.cityscapeLabel}
        </p>
        <h1 className="detail-headline">{destination.name}</h1>
        <p className="detail-airport">
          {destination.airport} · {destination.airportCode}
        </p>

        <div className="weather-status" aria-live="polite">
          {weather ? (
            <>
              {(() => {
                const WeatherIcon = weatherIconByAtmosphere[weather.atmosphere];
                return <WeatherIcon size={21} aria-hidden="true" />;
              })()}
              <div>
                <span className="weather-status__eyebrow">Live conditions · {weather.isDaytime ? 'Day' : 'Night'}</span>
                <strong>{weather.condition} · {weather.temperature}°C</strong>
              </div>
              <span className="weather-status__wind">{weather.windSpeed} km/h wind</span>
            </>
          ) : (
            <span className="weather-status__loading">{isLoading ? 'Loading live weather…' : 'Live weather temporarily unavailable'}</span>
          )}
        </div>
        <p className="weather-attribution">
          Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
        </p>

        <div className="detail-actions">
          <button
            type="button"
            className="destination-cta detail-cta"
            style={{ background: destination.accent }}
            onClick={() => setPlannerOpen(true)}
          >
            {added ? 'Add another journey' : 'Add to my atlas'}
          </button>
          {added && <Link to="/atlas" className="detail-outline-action">View my atlas</Link>}
          <button type="button" className="detail-outline-action">
            Live flight search
          </button>
        </div>

        <section className="detail-guide" aria-labelledby="guide-title">
          <div className="detail-section-heading">
            <Compass size={18} aria-hidden="true" />
            <div>
              <p>Local field notes</p>
              <h2 id="guide-title">What to do in {destination.name}</h2>
            </div>
          </div>
          <div className="recommendation-list">
            {destination.recommendations.map((recommendation) => (
              <article className="recommendation-card" key={recommendation.title}>
                <span style={{ color: destination.accent }}>{recommendation.tag}</span>
                <h3>{recommendation.title}</h3>
                <p>{recommendation.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="detail-promotion" style={{ '--destination-accent': destination.accent } as React.CSSProperties}>
          <Tag size={20} aria-hidden="true" />
          <div>
            <span>{destination.promotion.label}</span>
            <h2>{destination.promotion.title}</h2>
            <p>{destination.promotion.detail}</p>
          </div>
        </aside>
      </div>
      {plannerOpen && (
        <TripPlannerModal
          destination={destination}
          onDismiss={() => setPlannerOpen(false)}
          onSaved={(trip) => {
            upsertTrip(trip);
            setAdded(true);
            setPlannerOpen(false);
          }}
        />
      )}
    </div>
  );
}
