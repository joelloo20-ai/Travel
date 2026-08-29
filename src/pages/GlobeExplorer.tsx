import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, Move, Plane, Ship } from 'lucide-react';
import { GlobeStage } from '../components/GlobeStage';
import {
  DEFAULT_DESTINATION_KEY,
  destinationByKey,
  destinations,
  journeys,
} from '../data/destinations';

const journeyIcon = (destinationKey: string) => (destinationKey === 'disney-cruise' ? Ship : Plane);

export function GlobeExplorer() {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(DEFAULT_DESTINATION_KEY);
  const selected = destinationByKey(selectedKey) ?? destinationByKey(DEFAULT_DESTINATION_KEY)!;

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
            <div className="brand-orb">
              <span className="brand-orb-letter">T</span>
            </div>
            <div className="brand-text">
              <span className="brand-title">The Travel Quest</span>
              <span className="brand-subtitle">Private World Atlas</span>
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

        <GlobeStage selectedKey={selectedKey} onSelect={handleSelect} />

        <div className="instruction-row">
          <Move size={16} aria-hidden="true" />
          <span>Drag to turn · hover airport beacons · select a city</span>
        </div>

        <div className="pin-callout">
          <span className="pin-callout-ring" aria-hidden="true" />
          <MapPin size={16} className="pin-callout-icon" aria-hidden="true" />
          <div className="pin-callout-text">
            <span className="pin-callout-city">Singapore</span>
            <span className="pin-callout-label">Home Port</span>
          </div>
        </div>

        <div className="journey-panel">
          <span className="journey-eyebrow">Your Dated Journeys</span>
          <div className="journey-pills">
            {journeys.map((journey) => {
              const Icon = journeyIcon(journey.destinationKey);
              const isSelected = journey.destinationKey === selectedKey;
              return (
                <button
                  key={journey.destinationKey}
                  type="button"
                  className={`journey-pill${isSelected ? ' is-selected' : ''}`}
                  onClick={() => handleSelect(journey.destinationKey)}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span className="journey-pill-text">
                    <span className="journey-pill-label">{journey.label}</span>
                    <span className="journey-pill-dates">{journey.dates}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="destination-card">
          <p className="destination-eyebrow" style={{ color: selected.accent }}>
            {selected.cityscapeLabel}
          </p>
          <div className="destination-headline-wrap">
            <h1 className="destination-headline">{selected.name}</h1>
          </div>
          <div className="destination-meta">
            <span>{selected.airport}</span>
            <span>{selected.airportCode}</span>
          </div>
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
