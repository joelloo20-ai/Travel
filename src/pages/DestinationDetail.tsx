import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Plane, Sparkles, UtensilsCrossed } from 'lucide-react';
import { destinationByKey } from '../data/destinations';
import { useLiveWeather } from '../hooks/useLiveWeather';
import { useLocalTime } from '../hooks/useLocalTime';
import { LandmarkScene } from '../components/landmark/LandmarkScene';
import { ConditionsHud } from '../components/landmark/ConditionsHud';

const planningCards = [
  {
    title: 'Flight lens',
    icon: Plane,
    body: 'Track fares, layovers and seat picks for this route in one glance.',
  },
  {
    title: 'Food rhythm',
    icon: UtensilsCrossed,
    body: 'A loose cadence of where to eat, from first coffee to last supper.',
  },
  {
    title: 'Events',
    icon: Calendar,
    body: 'Whatever is on while you are there — festivals, matches, openings.',
  },
  {
    title: "Bel's run",
    icon: Sparkles,
    body: "The personal shortlist: the handful of things worth going out of the way for.",
  },
];

export function DestinationDetail() {
  const { key } = useParams<{ key: string }>();
  const destination = key ? destinationByKey(key) : undefined;
  const { weather, loading: weatherLoading, error: weatherError } = useLiveWeather(
    destination?.latitude ?? 0,
    destination?.longitude ?? 0,
  );
  const localTime = useLocalTime(destination?.timezone ?? 'UTC');
  const [added, setAdded] = useState(false);

  if (!destination) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="destination-detail">
      <div className="destination-detail__scene">
        <LandmarkScene destination={destination} weather={weather} localTime={localTime} loading={weatherLoading} />
      </div>
      <div className="destination-detail__scrim" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />

      <Link to="/" className="detail-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Globe
      </Link>

      <div className="detail-coordinates">
        <MapPin size={13} aria-hidden="true" />
        {destination.latitude.toFixed(4)}° {destination.latitude >= 0 ? 'N' : 'S'},{' '}
        {destination.longitude.toFixed(4)}° {destination.longitude >= 0 ? 'E' : 'W'}
      </div>

      <ConditionsHud
        weather={weather}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        localTime={localTime}
        accent={destination.accent}
      />

      <div className="detail-content">
        <p className="destination-eyebrow" style={{ color: destination.accent }}>
          {destination.cityscapeLabel}
        </p>
        <h1 className="detail-headline">{destination.name}</h1>
        <p className="detail-airport">
          {destination.landmarkName} · {destination.airport} · {destination.airportCode}
        </p>

        <div className="detail-actions">
          <button
            type="button"
            className="destination-cta detail-cta"
            style={{ background: destination.accent }}
            onClick={() => setAdded(true)}
          >
            {added ? 'Added to my atlas' : 'Add to my atlas'}
          </button>
          <button type="button" className="detail-outline-action">
            Live flight search
          </button>
        </div>

        <div className="detail-planning-grid">
          {planningCards.map(({ title, icon: Icon, body }) => (
            <div className="detail-planning-card" key={title}>
              <Icon size={18} className="detail-planning-icon" aria-hidden="true" />
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
