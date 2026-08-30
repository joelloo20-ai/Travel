import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, Move, Plane, Plus, Ship } from 'lucide-react';
import { StaticAtlas } from '../components/StaticAtlas';
import {
  DEFAULT_DESTINATION_KEY,
  destinationByKey,
  destinations,
} from '../data/destinations';
import { getTrips } from '../lib/tripStore';
import type { Trip } from '../types/trips';

const GlobeStage = lazy(() => import('../components/GlobeStage').then((module) => ({ default: module.GlobeStage })));

const journeyIcon = (trip: Trip) => (trip.destination.toLowerCase().includes('cruise') ? Ship : Plane);
const journeyDateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function formatJourneyDates(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return 'Dates not recorded';
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  return startDate === endDate ? journeyDateFormatter.format(start) : `${journeyDateFormatter.format(start)} – ${journeyDateFormatter.format(end)}`;
}

function estimatedFlightDuration(destinationLatitude: number, destinationLongitude: number): string {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const distance = 6371 * Math.acos(
    Math.sin(radians(1.3644)) * Math.sin(radians(destinationLatitude))
    + Math.cos(radians(1.3644)) * Math.cos(radians(destinationLatitude)) * Math.cos(radians(destinationLongitude - 103.9915)),
  );
  const minutes = Math.max(70, Math.round((distance / 850 + 0.45) * 60 / 5) * 5);
  return `~${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function GlobeExplorer() {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(DEFAULT_DESTINATION_KEY);
  const [savedTrips, setSavedTrips] = useState<Trip[]>(() => getTrips());
  const selected = destinationByKey(selectedKey) ?? destinationByKey(DEFAULT_DESTINATION_KEY)!;
  const flightDuration = selected.airportCode === 'SIN' ? '' : estimatedFlightDuration(selected.latitude, selected.longitude);
  const cityTrips = useMemo(() => {
    const city = selected.name.toLowerCase();
    return savedTrips.filter((trip) => `${trip.destination} ${trip.title}`.toLowerCase().includes(city));
  }, [savedTrips, selected.name]);
  const { nextTrip, pastTripCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const datedTrips = cityTrips.filter((trip) => /^\d{4}-\d{2}-\d{2}$/.test(trip.startDate));
    const upcoming = datedTrips.filter((trip) => new Date(`${trip.startDate}T12:00:00`) >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
    return { nextTrip: upcoming[0], pastTripCount: datedTrips.length - upcoming.length };
  }, [cityTrips]);
  const orderedTrips = useMemo(
    () => [...savedTrips].sort((first, second) => first.startDate.localeCompare(second.startDate)),
    [savedTrips],
  );

  useEffect(() => {
    const refreshTrips = () => setSavedTrips(getTrips());
    window.addEventListener('focus', refreshTrips);
    window.addEventListener('storage', refreshTrips);
    return () => {
      window.removeEventListener('focus', refreshTrips);
      window.removeEventListener('storage', refreshTrips);
    };
  }, []);

  const handleSelect = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);

  const handleExplore = useCallback(() => {
    navigate(`/destination/${selected.key}`);
  }, [navigate, selected.key]);

  return (
    <div className="app-shell">
      <div className="horizon-glow" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />

      <div className="nav-bar-shell">
        <nav className="nav-bar">
          <div className="brand">
            <div className="brand-text">
              <span className="brand-title">JayBee Travels</span>
              <span className="brand-subtitle">A private world atlas</span>
            </div>
          </div>

          <div className="nav-route">
            <span className="nav-route-code">SIN</span>
            <span className="nav-route-line" aria-hidden="true" />
            <span className="nav-route-code">{selected.airportCode}</span>
          </div>

          <div className="nav-pill">
            <span className="nav-pill-dot" aria-hidden="true" />
            City Explorer
          </div>
        </nav>
      </div>

      <div className="explorer-stage">
        <span className="scan-line scan-line--one" aria-hidden="true" />
        <span className="scan-line scan-line--two" aria-hidden="true" />

        <Suspense fallback={<div className="globe-footprint"><StaticAtlas loading selectedKey={selectedKey} /></div>}>
          <GlobeStage selectedKey={selectedKey} onSelect={handleSelect} />
        </Suspense>

        <div className="instruction-row">
          <Move size={16} aria-hidden="true" />
          <span>Drag to turn · hover airport beacons · select a city</span>
        </div>

        <button type="button" className="pin-callout" onClick={() => navigate('/destination/singapore')} aria-label="Explore Singapore">
          <span className="pin-callout-ring" aria-hidden="true" />
          <MapPin size={16} className="pin-callout-icon" aria-hidden="true" />
          <div className="pin-callout-text">
            <span className="pin-callout-city">Singapore</span>
            <span className="pin-callout-label">Home Port</span>
          </div>
        </button>

        <div className="journey-panel">
          <div className="journey-panel__heading">
            <span className="journey-eyebrow">Your Dated Journeys</span>
            <div className="journey-panel__actions">
              {orderedTrips.length > 0 && <span className="journey-count">{orderedTrips.length}</span>}
              <button type="button" className="journey-add" onClick={() => navigate('/atlas?new=1&from=globe')}><Plus size={13} /> Plan trip</button>
            </div>
          </div>
          <div className="journey-pills">
            {orderedTrips.length > 0 ? orderedTrips.map((trip) => {
              const Icon = journeyIcon(trip);
              return (
                <button
                  key={trip.id}
                  type="button"
                  className="journey-pill"
                  onClick={() => navigate(`/atlas?journey=${encodeURIComponent(trip.id)}&from=globe`)}
                  aria-label={`Open itinerary for ${trip.title}`}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span className="journey-pill-text">
                    <span className="journey-pill-label">{trip.title}</span>
                    <span className="journey-pill-dates">{formatJourneyDates(trip.startDate, trip.endDate)}</span>
                  </span>
                </button>
              );
            }) : (
              <button type="button" className="journey-empty" onClick={() => navigate('/atlas?new=1&from=globe')}>
                <Plus size={15} aria-hidden="true" />
                <span>Plan your first journey</span>
              </button>
            )}
          </div>
          {orderedTrips.length > 0 && <button type="button" className="journey-see-more" onClick={() => navigate('/atlas')}>See all itineraries <ArrowUpRight size={13} /></button>}
        </div>

        <div className="destination-card">
          <p className="destination-visits">{nextTrip ? <><strong>Upcoming</strong> · {formatJourneyDates(nextTrip.startDate, nextTrip.endDate)}</> : <><strong>{pastTripCount}</strong> {pastTripCount === 1 ? 'past trip together' : 'past trips together'}</>}</p>
          <div className="destination-headline-wrap">
            <h1 className="destination-headline">{selected.name}</h1>
          </div>
          <div className="destination-meta">
            <span>{selected.airport}</span>
            <span>{selected.airportCode}</span>
          </div>
          {flightDuration && <div className="destination-flight-duration"><Plane size={14} aria-hidden="true" /><span>From Singapore</span><strong>{flightDuration}</strong></div>}
          <div className="destination-country-row">
            <strong>{selected.countryName}</strong>
            <span>{selected.primary ? 'Primary city point' : 'Second city point'}</span>
          </div>
          <button
            type="button"
            className="destination-cta"
            style={{ background: selected.accent }}
            onClick={handleExplore}
          >
            Explore {selected.name} <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="city-chip-row">
          {destinations.map((destination) => (
            <button
              key={destination.key}
              type="button"
              className={`city-chip${destination.key === selectedKey ? ' is-active' : ''}`}
              onClick={() => handleSelect(destination.key)}
            >
              <span
                className="city-chip-dot"
                style={{ background: destination.accent }}
                aria-hidden="true"
              />
              <span>{destination.name}</span>
              <span className="city-chip-code">{destination.airportCode}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
