import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Download, FileSpreadsheet, MapPin, PencilLine, Plus, Route } from 'lucide-react';
import { TripPlannerModal } from '../components/TripPlannerModal';
import { destinations } from '../data/destinations';
import { downloadTripCsv, getTrips, upsertTrip } from '../lib/tripStore';
import type { Trip } from '../types/trips';

function formatDates(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  return startDate === endDate ? formatter.format(start) : `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function Atlas() {
  const [trips, setTrips] = useState<Trip[]>(() => getTrips());
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultDestination = destinations[0];
  const journeyId = searchParams.get('journey');

  const orderedTrips = useMemo(
    () => [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [trips],
  );

  useEffect(() => {
    if (!journeyId) return;
    const trip = trips.find((item) => item.id === journeyId);
    if (!trip) return;
    setEditingTrip(trip);
    setPlannerOpen(true);
  }, [journeyId, trips]);

  const clearJourneyRoute = () => setSearchParams({}, { replace: true });

  const saveTrip = (trip: Trip) => {
    setTrips(upsertTrip(trip));
    setPlannerOpen(false);
    setEditingTrip(undefined);
    clearJourneyRoute();
  };

  const openNewTrip = () => {
    setEditingTrip(undefined);
    setPlannerOpen(true);
    clearJourneyRoute();
  };

  const openTrip = (trip: Trip) => {
    setSearchParams({ journey: trip.id });
  };

  const dismissPlanner = () => {
    setPlannerOpen(false);
    setEditingTrip(undefined);
    clearJourneyRoute();
  };

  return (
    <main className="atlas-page">
      <div className="grain-overlay" aria-hidden="true" />
      <header className="atlas-page__header">
        <Link to="/" className="detail-back"><ArrowLeft size={16} aria-hidden="true" /> Globe</Link>
        <span className="atlas-page__mark"><Route size={16} /> My atlas</span>
      </header>

      <section className="atlas-hero">
        <div>
          <p className="destination-eyebrow">A record of the roads ahead</p>
          <h1>Your dated journeys, in one place.</h1>
          <p>Give every trip its own timeline, then export the complete itinerary to a spreadsheet whenever you need it.</p>
        </div>
        <button type="button" className="trip-primary-button atlas-hero__button" onClick={openNewTrip}><Plus size={17} /> Plan a trip</button>
      </section>

      <section className="atlas-template-card" aria-label="Travel spreadsheet template">
        <FileSpreadsheet size={25} aria-hidden="true" />
        <div>
          <span>Google Sheets-ready template</span>
          <h2>One tab per trip. All the practical detail.</h2>
          <p>Copy the Trip Template tab for each journey, or export any saved trip as a clean CSV to import into Google Sheets.</p>
        </div>
        <a className="trip-secondary-button" href="/travel-atlas-template.xlsx" download><Download size={16} /> Download template</a>
      </section>

      <section className="atlas-journeys" aria-labelledby="atlas-journeys-title">
        <div className="atlas-section-heading">
          <div>
            <span>Saved journeys</span>
            <h2 id="atlas-journeys-title">{orderedTrips.length ? `${orderedTrips.length} ${orderedTrips.length === 1 ? 'journey' : 'journeys'} in your atlas` : 'Start your first journey'}</h2>
          </div>
        </div>

        {orderedTrips.length ? (
          <div className="atlas-trip-list">
            {orderedTrips.map((trip) => (
              <article className="atlas-trip-card" key={trip.id}>
                <button type="button" className="atlas-trip-card__main" onClick={() => openTrip(trip)} aria-label={`Edit ${trip.title}`}>
                  <span className="atlas-trip-card__date"><CalendarDays size={15} /> {formatDates(trip.startDate, trip.endDate)}</span>
                  <h3>{trip.title}</h3>
                  <p><MapPin size={14} /> {trip.destination} · {trip.itinerary.length} {trip.itinerary.length === 1 ? 'activity' : 'activities'}</p>
                  <span className="atlas-trip-card__edit"><PencilLine size={15} /> Open itinerary</span>
                </button>
                <button type="button" className="atlas-trip-card__export" onClick={() => downloadTripCsv(trip)} aria-label={`Export ${trip.title} for Google Sheets`}>
                  <Download size={16} /> <span>Export CSV</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <button type="button" className="atlas-empty-state" onClick={openNewTrip}>
            <CalendarDays size={23} />
            <span>Pick a destination and add your dates. Your editable itinerary will appear here.</span>
            <strong>Plan your first trip <Plus size={15} /></strong>
          </button>
        )}
      </section>

      {plannerOpen && (
        <TripPlannerModal
          destination={defaultDestination}
          trip={editingTrip}
          onDismiss={dismissPlanner}
          onSaved={saveTrip}
        />
      )}
    </main>
  );
}
