import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { CalendarDays, CheckCircle2, FileText, Link2, MapPin, Plane, Plus, ReceiptText, Sparkles, Trash2, Upload, X } from 'lucide-react';
import type { Destination } from '../data/destinations';
import { generateItinerary, generateResearchedItinerary, ITINERARY_ASSISTANT_INSTRUCTION } from '../lib/itineraryAssistant';
import { findPublicPlaces } from '../lib/publicPlaceResearch';
import { createItineraryEntry, createTripDocument, makeId } from '../lib/tripStore';
import type { ItineraryEntry, Trip, TripDocument } from '../types/trips';

interface TripPlannerModalProps {
  destination: Destination;
  trip?: Trip;
  initialEntryDate?: string;
  requireFlightDetails?: boolean;
  onDismiss: () => void;
  onSaved: (trip: Trip) => void;
  onDraftSave?: (trip: Trip) => void;
}

type LegacyItineraryEntry = Partial<ItineraryEntry> & { price?: string; link?: string };

function initialDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInitialTrip(destination: Destination, trip?: Trip, initialEntryDate?: string) {
  const date = initialDate();
  const fallbackDate = initialEntryDate ?? trip?.startDate ?? date;
  const existingItinerary = trip?.itinerary?.length
    ? [
      ...trip.itinerary.map((rawEntry) => {
        const entry = rawEntry as LegacyItineraryEntry;
        return {
          ...createItineraryEntry(entry.destination || destination.name, entry.date || fallbackDate),
          ...entry,
          date: entry.date || fallbackDate,
          destination: entry.destination || destination.name,
          actualCostSgd: entry.actualCostSgd ?? entry.price ?? '',
          googleMapsLink: entry.googleMapsLink ?? entry.link ?? '',
        };
      }),
      ...(initialEntryDate && !trip.itinerary.some((entry) => entry.date === initialEntryDate)
        ? [createItineraryEntry(destination.name, initialEntryDate)]
        : []),
    ]
    : [];

  const initialTrip = {
    title: trip?.title ?? `${destination.name} journey`,
    destination: trip?.destination ?? destination.name,
    startDate: trip?.startDate ?? date,
    endDate: trip?.endDate ?? date,
    travelers: trip?.travelers ?? '1',
    notes: trip?.notes ?? '',
    hotel: trip?.hotel ?? { name: '', fromDate: trip?.startDate ?? date, toDate: trip?.endDate ?? date, address: '', pricePaidSgd: '' },
    flight: trip?.flight ?? { airline: '', flightNumber: '', route: '', departureTime: '', arrivalTime: '', pricePaidSgd: '' },
    itinerary: existingItinerary,
    documents: trip?.documents ?? [],
  };

  return existingItinerary.length ? initialTrip : { ...initialTrip, itinerary: generateItinerary(initialTrip) };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TripPlannerModal({ destination, trip, initialEntryDate, onDismiss, onSaved, onDraftSave, requireFlightDetails = false }: TripPlannerModalProps) {
  const titleId = useId();
  const [form, setForm] = useState(() => getInitialTrip(destination, trip, initialEntryDate));
  const [error, setError] = useState('');
  const [draftId, setDraftId] = useState(() => trip?.id ?? makeId('trip'));
  const [researching, setResearching] = useState(false);
  const [researchMessage, setResearchMessage] = useState('');
  const lastSavedForm = useRef(JSON.stringify(getInitialTrip(destination, trip, initialEntryDate)));

  useEffect(() => {
    const nextForm = getInitialTrip(destination, trip, initialEntryDate);
    setForm(nextForm);
    setDraftId(trip?.id ?? makeId('trip'));
    lastSavedForm.current = JSON.stringify(nextForm);
    setError('');
  }, [destination, trip, initialEntryDate]);

  const makeTrip = (current = form): Trip => {
    const now = new Date().toISOString();
    return {
      id: trip?.id ?? draftId,
      title: current.title.trim(),
      destination: current.destination.trim(),
      startDate: current.startDate,
      endDate: current.endDate,
      travelers: current.travelers.trim(),
      notes: current.notes.trim(),
      hotel: current.hotel,
      flight: current.flight,
      itinerary: current.itinerary.map((entry) => ({ ...entry, destination: entry.destination.trim() || current.destination.trim() })),
      documents: current.documents,
      createdAt: trip?.createdAt ?? now,
      updatedAt: now,
    };
  };

  useEffect(() => {
    // A new journey is only written after its explicit "Add to my atlas"
    // action. Autosaving a blank new-plan modal created phantom city tabs.
    if (!trip || !onDraftSave || !form.title.trim() || !form.destination.trim() || !form.startDate || !form.endDate || form.endDate < form.startDate) return;
    const serialized = JSON.stringify(form);
    if (serialized === lastSavedForm.current) return;
    const timer = window.setTimeout(() => {
      lastSavedForm.current = serialized;
      onDraftSave(makeTrip(form));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [draftId, form, onDraftSave, trip]);

  const updateEntry = (id: string, field: keyof ItineraryEntry, value: string) => {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    }));
  };

  const addEntry = () => {
    setForm((current) => ({
      ...current,
      itinerary: [...current.itinerary, createItineraryEntry(current.destination, current.startDate)],
    }));
  };

  const removeEntry = (id: string) => {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary.length === 1 ? current.itinerary : current.itinerary.filter((entry) => entry.id !== id),
    }));
  };

  const addDocuments = (event: ChangeEvent<HTMLInputElement>) => {
    const newDocuments = Array.from(event.target.files ?? []).map(createTripDocument);
    if (!newDocuments.length) return;
    setForm((current) => ({ ...current, documents: [...current.documents, ...newDocuments] }));
    event.target.value = '';
  };

  const removeDocument = (id: string) => {
    setForm((current) => ({ ...current, documents: current.documents.filter((document) => document.id !== id) }));
  };

  const researchAndGenerate = async () => {
    if (!form.destination.trim()) {
      setResearchMessage('Add a city first, then research local recommendations.');
      return;
    }
    setResearching(true);
    setResearchMessage('Finding public-map recommendations…');
    try {
      const places = await findPublicPlaces(form.destination, new AbortController().signal);
      setForm((current) => ({ ...current, itinerary: generateResearchedItinerary(current, places) }));
      setResearchMessage(`Added ${places.length} local sights, parks and food spots. Review the TikTok reel links in Notes before booking.`);
    } catch (researchError) {
      setResearchMessage(researchError instanceof Error ? researchError.message : 'Research is unavailable right now.');
    } finally {
      setResearching(false);
    }
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.destination.trim() || !form.startDate || !form.endDate) {
      setError('Add a trip name, destination, and travel dates to save this journey.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('The end date needs to be on or after the start date.');
      return;
    }
    if (requireFlightDetails && !form.flight.airline.trim() && !form.flight.flightNumber.trim() && !form.flight.route.trim() && !form.documents.length) {
      setError('Add an airline, flight number or route—or upload a flight confirmation—to record this itinerary.');
      return;
    }

    onSaved(makeTrip());
  };

  return (
    <div className="trip-modal" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onDismiss()}>
      <section className="trip-modal__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="trip-modal__header">
          <div>
            <span className="trip-modal__eyebrow">{trip ? 'Journey editor' : 'New atlas journey'}</span>
            <h2 id={titleId}>{trip ? `Edit ${trip.title}` : `Plan ${destination.name}`}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onDismiss} aria-label="Close trip planner">
            <X size={20} />
          </button>
        </div>

        <form className="trip-planner" onSubmit={save}>
          <div className="trip-form-grid trip-form-grid--overview">
            <label>
              <span>Trip name</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Autumn in Kyoto" />
            </label>
            <label>
              <span>Base destination</span>
              <input value={form.destination} onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))} placeholder="City or country" />
            </label>
            <label>
              <span>Start date</span>
              <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
            </label>
            <label>
              <span>End date</span>
              <input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
            </label>
            <label>
              <span>Travellers</span>
              <input value={form.travelers} onChange={(event) => setForm((current) => ({ ...current, travelers: event.target.value }))} placeholder="e.g. 2 adults" />
            </label>
            <label className="trip-form-grid__wide">
              <span>Trip notes</span>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Bookings to make, dietary notes, a small wish list…" rows={2} />
            </label>
          </div>

          <div className="trip-planner__section-heading">
            <div>
              <span className="trip-modal__eyebrow"><CalendarDays size={13} /> Full itinerary</span>
              <h3>Build the day, one stop at a time</h3>
            </div>
            <button type="button" className="trip-secondary-button" onClick={addEntry}>
              <Plus size={16} /> Add activity
            </button>
          </div>

          <section className="itinerary-assistant" aria-label="Itinerary assistant">
            <div className="itinerary-assistant__icon"><Sparkles size={18} /></div>
            <div>
              <span className="trip-modal__eyebrow">Itinerary assistant</span>
              <h3>Build an itinerary for any city</h3>
              <p>{ITINERARY_ASSISTANT_INSTRUCTION} Research uses public OpenStreetMap data and adds a TikTok reel check to each suggestion.</p>
            </div>
            <button
              type="button"
              className="trip-primary-button itinerary-assistant__button"
              onClick={() => void researchAndGenerate()}
              disabled={researching}
            >
              <Sparkles size={16} /> {researching ? 'Researching…' : 'Research top picks'}
            </button>
          </section>
          {researchMessage && <p className="trip-research-status" role="status">{researchMessage}</p>}

          <section className="trip-logistics" aria-label="Stay and flight details">
            <div className="trip-logistics__block">
              <div className="trip-logistics__heading"><MapPin size={16} /><div><span>Stay record</span><h3>Hotel details</h3></div></div>
              <div className="trip-form-grid trip-form-grid--logistics">
                <label className="trip-form-grid__wide"><span>Hotel name</span><input value={form.hotel.name} onChange={(event) => setForm((current) => ({ ...current, hotel: { ...current.hotel, name: event.target.value } }))} placeholder="Hotel or accommodation" /></label>
                <label><span>From date</span><input type="date" value={form.hotel.fromDate} onChange={(event) => setForm((current) => ({ ...current, hotel: { ...current.hotel, fromDate: event.target.value } }))} /></label>
                <label><span>To date</span><input type="date" value={form.hotel.toDate} onChange={(event) => setForm((current) => ({ ...current, hotel: { ...current.hotel, toDate: event.target.value } }))} /></label>
                <label className="trip-form-grid__wide"><span>Address</span><input value={form.hotel.address} onChange={(event) => setForm((current) => ({ ...current, hotel: { ...current.hotel, address: event.target.value } }))} placeholder="Street address" /></label>
                <label><span>Price paid (SGD)</span><input inputMode="decimal" value={form.hotel.pricePaidSgd} onChange={(event) => setForm((current) => ({ ...current, hotel: { ...current.hotel, pricePaidSgd: event.target.value } }))} placeholder="0.00" /></label>
              </div>
            </div>
            <div className="trip-logistics__block">
              <div className="trip-logistics__heading"><Plane size={16} /><div><span>Flight record</span><h3>Flight details</h3></div></div>
              <div className="trip-form-grid trip-form-grid--logistics">
                <label><span>Airline</span><input value={form.flight.airline} onChange={(event) => setForm((current) => ({ ...current, flight: { ...current.flight, airline: event.target.value } }))} placeholder="Airline name" /></label>
                <label><span>Flight number</span><input value={form.flight.flightNumber} onChange={(event) => setForm((current) => ({ ...current, flight: { ...current.flight, flightNumber: event.target.value } }))} placeholder="SQ 032" /></label>
                <label className="trip-form-grid__wide"><span>Route</span><input value={form.flight.route} onChange={(event) => setForm((current) => ({ ...current, flight: { ...current.flight, route: event.target.value } }))} placeholder="Singapore → San Francisco" /></label>
                <label><span>Departure</span><input type="datetime-local" value={form.flight.departureTime} onChange={(event) => setForm((current) => ({ ...current, flight: { ...current.flight, departureTime: event.target.value } }))} /></label>
                <label><span>Arrival</span><input type="datetime-local" value={form.flight.arrivalTime} onChange={(event) => setForm((current) => ({ ...current, flight: { ...current.flight, arrivalTime: event.target.value } }))} /></label>
                <label><span>Price paid (SGD)</span><input inputMode="decimal" value={form.flight.pricePaidSgd} onChange={(event) => setForm((current) => ({ ...current, flight: { ...current.flight, pricePaidSgd: event.target.value } }))} placeholder="0.00" /></label>
              </div>
            </div>
          </section>

          <div className="itinerary-editor">
            {form.itinerary.map((entry, index) => (
              <article className="itinerary-entry" key={entry.id}>
                <div className="itinerary-entry__index">{String(index + 1).padStart(2, '0')}</div>
                <div className="itinerary-entry__fields">
                  <label><span>Date</span><input type="date" value={entry.date} onChange={(event) => updateEntry(entry.id, 'date', event.target.value)} /></label>
                  <label><span>Start</span><input type="time" value={entry.startTime} onChange={(event) => updateEntry(entry.id, 'startTime', event.target.value)} /></label>
                  <label><span>End</span><input type="time" value={entry.endTime} onChange={(event) => updateEntry(entry.id, 'endTime', event.target.value)} /></label>
                  <label><span>Duration</span><input value={entry.duration} onChange={(event) => updateEntry(entry.id, 'duration', event.target.value)} placeholder="e.g. 2h" /></label>
                  <label className="itinerary-entry__place"><span>Getting there from the last stop</span><input value={entry.transitMode} onChange={(event) => updateEntry(entry.id, 'transitMode', event.target.value)} placeholder="e.g. 12 min walk, Muni N line" /></label>
                  <label><span>Distance (km)</span><input inputMode="decimal" value={entry.distanceKm} onChange={(event) => updateEntry(entry.id, 'distanceKm', event.target.value)} placeholder="e.g. 1.4" /></label>
                  <label className="itinerary-entry__place"><span>Place of interest</span><input value={entry.placeOfInterest} onChange={(event) => updateEntry(entry.id, 'placeOfInterest', event.target.value)} placeholder="e.g. Gardens by the Bay" /></label>
                  <label><span>Category</span><select value={entry.category} onChange={(event) => updateEntry(entry.id, 'category', event.target.value)}><option>Sightseeing</option><option>Food & drink</option><option>Stay</option><option>Transport</option><option>Wellness</option><option>Shopping</option><option>Other</option></select></label>
                  <label><span><CheckCircle2 size={12} /> Form verification</span><select value={entry.verification} onChange={(event) => updateEntry(entry.id, 'verification', event.target.value)}><option>Pending form verification</option><option>Verified from form</option><option>Not completed</option><option>Needs manual review</option></select></label>
                  <label><span>Actual cost (SGD)</span><input inputMode="decimal" value={entry.actualCostSgd} onChange={(event) => updateEntry(entry.id, 'actualCostSgd', event.target.value)} placeholder="From receipt / form" /></label>
                  <label><span>Manual cost (SGD)</span><input inputMode="decimal" value={entry.manualActualCostSgd} onChange={(event) => updateEntry(entry.id, 'manualActualCostSgd', event.target.value)} placeholder="Override if needed" /></label>
                  <label><span>How was it?</span><input value={entry.howWasIt} onChange={(event) => updateEntry(entry.id, 'howWasIt', event.target.value)} placeholder="Quick reflection" /></label>
                  <label className="itinerary-entry__wide"><span><Link2 size={12} /> Google Maps link</span><input type="url" value={entry.googleMapsLink} onChange={(event) => updateEntry(entry.id, 'googleMapsLink', event.target.value)} placeholder="https://maps.google.com/..." /></label>
                  <label className="itinerary-entry__wide"><span>Notes</span><input value={entry.notes} onChange={(event) => updateEntry(entry.id, 'notes', event.target.value)} placeholder="Reservation code, opening time, special request…" /></label>
                </div>
                <button type="button" className="itinerary-entry__remove" onClick={() => removeEntry(entry.id)} disabled={form.itinerary.length === 1} aria-label="Remove activity">
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>

          <div className="trip-documents">
            <div>
              <span className="trip-modal__eyebrow"><FileText size={13} /> Documents</span>
              <h3>Attach your itinerary or reservations</h3>
              <p>File references are saved with this journey so you can track what belongs to the trip.</p>
            </div>
            <label className="trip-upload-button">
              <Upload size={16} /> Add files
              <input type="file" multiple onChange={addDocuments} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp" />
            </label>
          </div>

          {form.documents.length > 0 && (
            <ul className="trip-document-list">
              {form.documents.map((document: TripDocument) => (
                <li key={document.id}>
                  <FileText size={15} />
                  <span>{document.name}</span>
                  <small>{formatFileSize(document.size)}</small>
                  <button type="button" onClick={() => removeDocument(document.id)} aria-label={`Remove ${document.name}`}><X size={14} /></button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="trip-form-error" role="alert">{error}</p>}
          <div className="trip-modal__footer">
            <p><ReceiptText size={15} /> Form-compatible columns, saved locally and ready for Sheets export.</p>
            <div>
              <button type="button" className="trip-secondary-button" onClick={onDismiss}>Cancel</button>
              <button type="submit" className="trip-primary-button">{trip ? 'Save itinerary' : 'Add to my atlas'}</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
