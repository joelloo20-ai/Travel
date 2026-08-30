import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CheckCircle2, Download, MapPin, PencilLine, Plus, RefreshCw, Route, Sparkles } from 'lucide-react';
import { ItineraryAssistantModal } from '../components/ItineraryAssistantModal';
import { TripPlannerModal } from '../components/TripPlannerModal';
import { TripTimelineModal } from '../components/TripTimelineModal';
import { destinations } from '../data/destinations';
import { generateItinerary, generateItineraryWithModel } from '../lib/itineraryAssistant';
import { downloadTripCsv, getTrips, saveTrips, upsertTrip } from '../lib/tripStore';
import { fetchSheetTrips, getSheetEndpoint, syncTripToSheet } from '../lib/sheetSync';
import type { Trip } from '../types/trips';

const sheetPlaceholders = ['Melbourne', 'China'];

function createSheetPlaceholder(destination: string): Trip {
  const date = new Date().toISOString().slice(0, 10);
  const placeholder: Trip = {
    id: `sheet-template-${destination.toLowerCase()}`,
    title: `${destination} suggested itinerary`,
    destination,
    startDate: date, endDate: date, travelers: '', notes: 'Suggested starter plan — edit the places, dates, hotel and travel times to suit your trip.',
    hotel: { name: '', fromDate: date, toDate: date, address: '', pricePaidSgd: '' },
    flight: { airline: '', flightNumber: '', route: '', departureTime: '', arrivalTime: '', pricePaidSgd: '' },
    itinerary: [], documents: [], createdAt: '', updatedAt: '',
  };
  return { ...placeholder, itinerary: generateItinerary(placeholder) };
}

function includeSuggestedItinerary(trip: Trip): Trip {
  const date = trip.startDate || new Date().toISOString().slice(0, 10);
  const suggestedTrip = {
    ...trip,
    title: trip.title || `${trip.destination} suggested itinerary`,
    startDate: date,
    endDate: trip.endDate || date,
    hotel: { ...trip.hotel, fromDate: trip.hotel?.fromDate || date, toDate: trip.hotel?.toDate || trip.endDate || date },
  };
  const hasPlannedItems = trip.itinerary.some((entry) => entry.placeOfInterest.trim());
  if (hasPlannedItems) {
    const datedTrip = {
      ...suggestedTrip,
      itinerary: trip.itinerary.map((entry) => ({ ...entry, date: entry.date || date, destination: entry.destination || trip.destination })),
    };
    const occupiedDates = new Set(datedTrip.itinerary.map((entry) => entry.date));
    const suggestedEntries = [];
    const start = new Date(`${datedTrip.startDate}T12:00:00`);
    const end = new Date(`${datedTrip.endDate}T12:00:00`);
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const currentDate = cursor.toISOString().slice(0, 10);
      if (!occupiedDates.has(currentDate)) {
        suggestedEntries.push(...generateItinerary({ ...datedTrip, startDate: currentDate, endDate: currentDate }));
      }
    }
    return { ...datedTrip, itinerary: [...datedTrip.itinerary, ...suggestedEntries] };
  }
  return { ...suggestedTrip, itinerary: generateItinerary(suggestedTrip) };
}

function includeSheetPlaceholders(trips: Trip[]): Trip[] {
  const suggestedTrips = trips.map(includeSuggestedItinerary);
  const existing = new Set(suggestedTrips.map((trip) => trip.destination.trim().toLowerCase()));
  return [...suggestedTrips, ...sheetPlaceholders.filter((city) => !existing.has(city.toLowerCase())).map(createSheetPlaceholder)];
}

function formatDates(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return 'Dates not recorded';
  const formatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  return startDate === endDate ? formatter.format(start) : `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function Atlas() {
  const [trips, setTrips] = useState<Trip[]>(() => includeSheetPlaceholders(getTrips()));
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [viewingTrip, setViewingTrip] = useState<Trip | undefined>();
  const [assistantTrip, setAssistantTrip] = useState<Trip | undefined>();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerDay, setPlannerDay] = useState<string | undefined>();
  const [sheetEndpoint] = useState(() => getSheetEndpoint());
  const [syncMessage, setSyncMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnToGlobe = useRef(searchParams.get('from') === 'globe');
  const defaultDestination = destinations[0];
  const journeyId = searchParams.get('journey');
  const startNewJourney = searchParams.get('new') === '1';

  const orderedTrips = useMemo(
    () => [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [trips],
  );

  useEffect(() => {
    if (journeyId) {
      const trip = trips.find((item) => item.id === journeyId);
      if (!trip) return;
      setViewingTrip(trip);
      return;
    }
    if (startNewJourney) {
      setEditingTrip(undefined);
      setPlannerOpen(true);
    }
  }, [journeyId, startNewJourney, trips]);

  const clearJourneyRoute = () => setSearchParams({}, { replace: true });

  const loadFromSheet = async (quiet = false) => {
    if (!sheetEndpoint) return;
    setSyncing(true);
    if (!quiet) setSyncMessage('Refreshing your journeys…');
    try {
      const importedTrips = await fetchSheetTrips(sheetEndpoint);
      const nextTrips = includeSheetPlaceholders(importedTrips);
      setTrips(nextTrips);
      saveTrips(nextTrips);
      // Suggested days used to exist only in the rendered UI. Materialize any
      // missing suggested stops so the Sheet remains the complete source of
      // truth for every itinerary the traveller can see.
      const expandedTrips = nextTrips.filter((trip) => {
        const imported = importedTrips.find((candidate) => candidate.id === trip.id);
        return imported && trip.itinerary.length > imported.itinerary.length;
      });
      if (expandedTrips.length) {
        setSyncMessage('Saving itinerary suggestions to your Sheet…');
        await Promise.all(expandedTrips.map((trip) => syncTripToSheet(trip, sheetEndpoint)));
      }
      setSyncMessage(`Up to date · ${nextTrips.length} ${nextTrips.length === 1 ? 'journey' : 'journeys'} loaded`);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Unable to refresh your journeys right now.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    void loadFromSheet(true);
    const interval = window.setInterval(() => void loadFromSheet(true), 45_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadFromSheet(true);
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [sheetEndpoint]);

  const saveTrip = (trip: Trip) => {
    setTrips(upsertTrip(trip));
    setPlannerOpen(false);
    setEditingTrip(undefined);
    setPlannerDay(undefined);
    setViewingTrip(trip);
    clearJourneyRoute();
    if (!sheetEndpoint) return;
    setSyncing(true);
    setSyncMessage('Saving your itinerary…');
    void syncTripToSheet(trip, sheetEndpoint)
      .then(() => setSyncMessage('Saved to your travel record'))
      .catch(() => setSyncMessage('Saved here, but the background sync needs attention.'))
      .finally(() => setSyncing(false));
  };

  const saveDraft = (trip: Trip) => {
    setTrips(includeSheetPlaceholders(upsertTrip(trip)));
    if (!sheetEndpoint) return;
    setSyncing(true);
    setSyncMessage('Saving edits to your travel record…');
    void syncTripToSheet(trip, sheetEndpoint)
      .then(() => setSyncMessage('Edits are live in your travel record'))
      .catch(() => setSyncMessage('Edits are saved here; the background sync needs attention.'))
      .finally(() => setSyncing(false));
  };

  const openNewTrip = () => {
    setEditingTrip(undefined);
    setPlannerDay(undefined);
    setPlannerOpen(true);
    clearJourneyRoute();
  };

  const openTrip = (trip: Trip) => {
    setViewingTrip(trip);
  };

  const updateTimelineEntries = (entries: Trip['itinerary']) => {
    if (!viewingTrip) return;
    const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
    const updatedTrip: Trip = {
      ...viewingTrip,
      itinerary: [...viewingTrip.itinerary.filter((current) => !entriesById.has(current.id)), ...entries],
      updatedAt: new Date().toISOString(),
    };
    setTrips(upsertTrip(updatedTrip));
    setViewingTrip(updatedTrip);
    if (!sheetEndpoint) return;
    setSyncing(true);
    setSyncMessage('Saving this stop…');
    void syncTripToSheet(updatedTrip, sheetEndpoint)
      .then(() => setSyncMessage('Stop saved to your travel record'))
      .catch(() => setSyncMessage('Stop saved here, but the background sync needs attention.'))
      .finally(() => setSyncing(false));
  };

  const buildWithAssistant = async () => {
    if (!assistantTrip) return;
    const result = await generateItineraryWithModel(assistantTrip);
    const updatedTrip = { ...assistantTrip, itinerary: result.itinerary, updatedAt: new Date().toISOString() };
    setTrips(upsertTrip(updatedTrip));
    if (viewingTrip?.id === updatedTrip.id) setViewingTrip(updatedTrip);
    setSyncMessage(result.source === 'model' ? 'AI itinerary built and ready to edit.' : 'Research-led itinerary built. Add an OpenAI API key to use the live model.');
    if (!sheetEndpoint) return;
    setSyncing(true);
    try { await syncTripToSheet(updatedTrip, sheetEndpoint); } finally { setSyncing(false); }
  };

  const dismissPlanner = () => {
    setPlannerOpen(false);
    setEditingTrip(undefined);
    setPlannerDay(undefined);
    if (returnToGlobe.current) navigate('/globe');
    else clearJourneyRoute();
  };

  const dismissItinerary = () => {
    setViewingTrip(undefined);
    if (returnToGlobe.current) navigate('/globe');
    else clearJourneyRoute();
  };

  return (
    <main className="atlas-page">
      <div className="grain-overlay" aria-hidden="true" />
      <header className="atlas-page__header">
        <Link to="/globe" className="detail-back"><ArrowLeft size={16} aria-hidden="true" /> Globe</Link>
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

      <section className="atlas-template-card atlas-template-card--quiet" aria-label="Travel records status">
        <CheckCircle2 size={25} aria-hidden="true" />
        <div>
          <span>Travel record</span>
          <h2>Your itinerary stays quietly up to date.</h2>
          <p>Create or edit a journey here and it is recorded in the background. Use the form for what actually happened on the trip.</p>
          {syncMessage && <p className="sheet-connection__status" role="status">{syncMessage}</p>}
        </div>
        <div className="atlas-template-card__actions">
          <button type="button" className="trip-secondary-button" onClick={() => void loadFromSheet()} disabled={syncing}><RefreshCw size={16} /> Refresh</button>
        </div>
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
                <button type="button" className="atlas-trip-card__export" onClick={() => downloadTripCsv(trip)} aria-label={`Export ${trip.title} itinerary`}>
                  <Download size={16} /> <span>Export CSV</span>
                </button>
                <button type="button" className="atlas-trip-card__assistant" onClick={() => setAssistantTrip(trip)} aria-label={`Build ${trip.title} with AI`}><Sparkles size={16} /><span>AI plan</span></button>
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
          initialEntryDate={plannerDay}
          onDismiss={dismissPlanner}
          onSaved={saveTrip}
          onDraftSave={saveDraft}
        />
      )}
      {viewingTrip && !plannerOpen && (
        <TripTimelineModal
          trip={viewingTrip}
          onDismiss={dismissItinerary}
          onEdit={() => {
            setEditingTrip(viewingTrip);
            setPlannerDay(undefined);
            setViewingTrip(undefined);
            setPlannerOpen(true);
          }}
          onUpdateEntries={updateTimelineEntries}
          onAskAssistant={() => setAssistantTrip(viewingTrip)}
        />
      )}
      {assistantTrip && <ItineraryAssistantModal trip={assistantTrip} onDismiss={() => setAssistantTrip(undefined)} onConfirm={buildWithAssistant} />}
    </main>
  );
}
