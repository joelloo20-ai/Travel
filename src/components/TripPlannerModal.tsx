import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from 'react';
import { CalendarDays, FileText, Link2, MapPin, Plus, Trash2, Upload, X } from 'lucide-react';
import type { Destination } from '../data/destinations';
import { createItineraryEntry, createTripDocument, makeId } from '../lib/tripStore';
import type { ItineraryEntry, Trip, TripDocument } from '../types/trips';

interface TripPlannerModalProps {
  destination: Destination;
  trip?: Trip;
  onDismiss: () => void;
  onSaved: (trip: Trip) => void;
}

function initialDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInitialTrip(destination: Destination, trip?: Trip) {
  const date = initialDate();
  return {
    title: trip?.title ?? `${destination.name} journey`,
    destination: trip?.destination ?? destination.name,
    startDate: trip?.startDate ?? date,
    endDate: trip?.endDate ?? date,
    travelers: trip?.travelers ?? '1',
    notes: trip?.notes ?? '',
    itinerary: trip?.itinerary?.length ? trip.itinerary : [createItineraryEntry(destination.name, trip?.startDate ?? date)],
    documents: trip?.documents ?? [],
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TripPlannerModal({ destination, trip, onDismiss, onSaved }: TripPlannerModalProps) {
  const titleId = useId();
  const [form, setForm] = useState(() => getInitialTrip(destination, trip));
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(getInitialTrip(destination, trip));
    setError('');
  }, [destination, trip]);

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

    const now = new Date().toISOString();
    onSaved({
      id: trip?.id ?? makeId('trip'),
      title: form.title.trim(),
      destination: form.destination.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      travelers: form.travelers.trim(),
      notes: form.notes.trim(),
      itinerary: form.itinerary.map((entry) => ({ ...entry, destination: entry.destination.trim() || form.destination.trim() })),
      documents: form.documents,
      createdAt: trip?.createdAt ?? now,
      updatedAt: now,
    });
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

          <div className="itinerary-editor">
            {form.itinerary.map((entry, index) => (
              <article className="itinerary-entry" key={entry.id}>
                <div className="itinerary-entry__index">{String(index + 1).padStart(2, '0')}</div>
                <div className="itinerary-entry__fields">
                  <label><span>Date</span><input type="date" value={entry.date} onChange={(event) => updateEntry(entry.id, 'date', event.target.value)} /></label>
                  <label><span>Start</span><input type="time" value={entry.startTime} onChange={(event) => updateEntry(entry.id, 'startTime', event.target.value)} /></label>
                  <label><span>End</span><input type="time" value={entry.endTime} onChange={(event) => updateEntry(entry.id, 'endTime', event.target.value)} /></label>
                  <label className="itinerary-entry__place"><span>Place of interest</span><input value={entry.placeOfInterest} onChange={(event) => updateEntry(entry.id, 'placeOfInterest', event.target.value)} placeholder="e.g. Gardens by the Bay" /></label>
                  <label><span>Destination</span><input value={entry.destination} onChange={(event) => updateEntry(entry.id, 'destination', event.target.value)} placeholder={form.destination} /></label>
                  <label><span>Category</span><select value={entry.category} onChange={(event) => updateEntry(entry.id, 'category', event.target.value)}><option>Sightseeing</option><option>Food & drink</option><option>Stay</option><option>Transport</option><option>Wellness</option><option>Shopping</option><option>Other</option></select></label>
                  <label><span>Price</span><input inputMode="decimal" value={entry.price} onChange={(event) => updateEntry(entry.id, 'price', event.target.value)} placeholder="0.00" /></label>
                  <label><span>Currency</span><input value={entry.currency} onChange={(event) => updateEntry(entry.id, 'currency', event.target.value.toUpperCase())} maxLength={3} placeholder="SGD" /></label>
                  <label><span>Distance (km)</span><input inputMode="decimal" value={entry.distanceKm} onChange={(event) => updateEntry(entry.id, 'distanceKm', event.target.value)} placeholder="From previous stop" /></label>
                  <label><span>Transit</span><input value={entry.transitMode} onChange={(event) => updateEntry(entry.id, 'transitMode', event.target.value)} placeholder="Walk, metro, taxi…" /></label>
                  <label className="itinerary-entry__wide"><span><Link2 size={12} /> Booking / map link</span><input type="url" value={entry.link} onChange={(event) => updateEntry(entry.id, 'link', event.target.value)} placeholder="https://" /></label>
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
            <p><MapPin size={15} /> Saved in this browser and ready for Sheets export.</p>
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
