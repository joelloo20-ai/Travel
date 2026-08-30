import { BusFront, CalendarDays, CarFront, Clock3, ExternalLink, Footprints, MapPin, Navigation, PencilLine, Plane, ReceiptText, Sparkles, TrainFront, X } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { createItineraryEntry } from '../lib/tripStore';
import type { ItineraryEntry, Trip } from '../types/trips';

interface TripTimelineModalProps {
  trip: Trip;
  onDismiss: () => void;
  onEdit: () => void;
  onUpdateEntries: (entries: ItineraryEntry[]) => void;
  onAskAssistant?: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function dateLabel(value: string): string {
  if (!value) return 'Date to be planned';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function timeLabel(entry: ItineraryEntry): string {
  if (!entry.startTime && !entry.endTime) return 'Time to be planned';
  return [entry.startTime, entry.endTime].filter(Boolean).join(' – ');
}

function costLabel(entry: ItineraryEntry): string {
  const cost = entry.manualActualCostSgd || entry.actualCostSgd;
  return cost ? `SGD ${cost}` : 'Cost to be confirmed';
}

function orderedEntries(entries: ItineraryEntry[]): ItineraryEntry[] {
  return [...entries].sort((a, b) => `${a.date}-${a.startTime}`.localeCompare(`${b.date}-${b.startTime}`));
}

function isIsoDate(value: string): boolean {
  return isoDatePattern.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function datesInTravelWindow(startDate: string, endDate: string): string[] {
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || endDate < startDate) return [];

  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function buildTimelineDays(trip: Trip, entries: ItineraryEntry[]): Array<[string, ItineraryEntry[]]> {
  const grouped = entries.reduce<Record<string, ItineraryEntry[]>>((groups, entry) => {
    const key = isIsoDate(entry.date) ? entry.date : 'unplanned';
    (groups[key] ??= []).push(entry);
    return groups;
  }, {});
  const entryDates = Object.keys(grouped).filter(isIsoDate);
  const dates = [...new Set([...datesInTravelWindow(trip.startDate, trip.endDate), ...entryDates])].sort();
  const scheduled = dates.map((date) => [date, grouped[date] ?? []] as [string, ItineraryEntry[]]);

  return grouped.unplanned?.length ? [...scheduled, ['unplanned', grouped.unplanned]] : scheduled;
}

function flightLegs(entries: ItineraryEntry[]) {
  return orderedEntries(entries)
    .filter((entry) => entry.category.toLowerCase() === 'transport' && /\bflight\b|\bTR\s?\d+\b|\bSQ\s?\d+\b/i.test(entry.placeOfInterest))
    .map((entry, index) => {
      const [, flight = entry.placeOfInterest, route = 'Route to be added'] = entry.placeOfInterest.match(/^(.+?)\s*[·-]\s*(.+)$/) ?? [];
      return {
        id: entry.id,
        label: index === 0 ? 'Outbound' : 'Return',
        flight,
        route,
        when: `${dateLabel(entry.date)} · ${timeLabel(entry)}`,
      };
    });
}

function displayedFlightLegs(entries: ItineraryEntry[]) {
  const recordedFlights = flightLegs(entries);
  if (recordedFlights.length > 1) return recordedFlights;
  if (recordedFlights.length === 1) {
    return [...recordedFlights, { id: 'return-not-recorded', label: 'Return', flight: 'Not recorded', route: 'Flight details to be added', when: '—' }];
  }

  return [
    { id: 'outbound-not-recorded', label: 'Outbound', flight: 'Not recorded', route: 'Flight details to be added', when: '—' },
    { id: 'return-not-recorded', label: 'Return', flight: 'Not recorded', route: 'Flight details to be added', when: '—' },
  ];
}

interface TimelineStopProps {
  entry: ItineraryEntry;
  index: number;
  isLast: boolean;
}

function TimelineStop({ entry, index, isLast }: TimelineStopProps) {
  return (
    <article className="timeline-stop" style={{ '--stop-index': index } as CSSProperties}>
      <div className="timeline-stop__rail"><span />{!isLast && <i />}</div>
      <div className="timeline-stop__time"><Clock3 size={14} /><strong>{timeLabel(entry)}</strong><span>{entry.duration || 'Duration TBD'}</span></div>
      <div className="timeline-stop__card">
        <div className="timeline-stop__topline"><span>{entry.category || 'Experience'}</span><span className={entry.verification?.includes('Verified') ? 'is-verified' : ''}>{entry.verification || 'Pending verification'}</span></div>
        <h3>{entry.placeOfInterest || 'Untitled stop'}</h3>
        <div className="timeline-stop__facts"><span><ReceiptText size={14} /> {costLabel(entry)}</span></div>
        {entry.notes && <p>{entry.notes}</p>}
        <div className="timeline-stop__footer">{entry.howWasIt && <em>“{entry.howWasIt}”</em>}{entry.googleMapsLink && <a href={entry.googleMapsLink} target="_blank" rel="noreferrer">Map <ExternalLink size={13} /></a>}</div>
      </div>
    </article>
  );
}

function timeToMinutes(value: string): number | undefined {
  const [hours, minutes] = value.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : undefined;
}

function formatTravelTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60 ? `${minutes % 60} min` : ''}`.trim();
}

function JourneyTransfer({ entry, previous }: { entry: ItineraryEntry; previous: ItineraryEntry }) {
  const mode = entry.transitMode || 'Travel details to be planned';
  const lower = mode.toLowerCase();
  const Icon = lower.includes('walk') ? Footprints : lower.includes('train') || lower.includes('metro') || lower.includes('subway') ? TrainFront : lower.includes('bus') ? BusFront : lower.includes('flight') ? Plane : CarFront;
  const distance = Number.parseFloat(entry.distanceKm);
  const speed = lower.includes('walk') ? 4.8 : lower.includes('train') || lower.includes('metro') || lower.includes('subway') || lower.includes('bus') || lower.includes('tram') ? 18 : lower.includes('flight') ? 650 : 26;
  const scheduledMinutes = (() => {
    const currentStart = timeToMinutes(entry.startTime);
    const previousEnd = timeToMinutes(previous.endTime);
    if (currentStart === undefined || previousEnd === undefined) return undefined;
    const gap = currentStart - previousEnd;
    return gap > 0 ? gap : undefined;
  })();
  const estimatedMinutes = Number.isFinite(distance) && distance > 0 ? Math.max(5, Math.round((distance / speed) * 60 + (lower.includes('walk') ? 0 : 5))) : scheduledMinutes ?? 12;
  const expectedCost = lower.includes('walk') ? 'Free' : lower.includes('train') || lower.includes('metro') || lower.includes('subway') || lower.includes('tram') || lower.includes('bus') ? 'Est. SGD 2–4' : lower.includes('flight') ? 'See flight record' : `Est. SGD ${Math.max(8, Math.round((Number.isFinite(distance) ? distance : 3) * 2.2 + 4))}`;
  const distanceLabel = Number.isFinite(distance) && distance > 0 ? `${distance.toFixed(distance < 10 ? 1 : 0)} km` : 'Route time based on your schedule';
  return <div className="timeline-transfer"><div className="timeline-transfer__line"><span><Icon size={16} aria-hidden="true" /></span></div><div className="timeline-transfer__details"><small>Directions from {previous.placeOfInterest || 'previous stop'}</small><strong>{mode}</strong><div className="timeline-transfer__metrics"><span><Clock3 size={14} aria-hidden="true" /> {formatTravelTime(estimatedMinutes)}</span><span><Navigation size={14} aria-hidden="true" /> {distanceLabel}</span><span><ReceiptText size={14} aria-hidden="true" /> {expectedCost}</span></div></div></div>;
}

interface TimelineDayProps {
  date: string;
  dayNumber: number | undefined;
  entries: ItineraryEntry[];
  destination: string;
  onUpdateEntries: (entries: ItineraryEntry[]) => void;
}

function TimelineDay({ date, dayNumber, entries, destination, onUpdateEntries }: TimelineDayProps) {
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState(entries);
  const update = (id: string, field: keyof ItineraryEntry, value: string) => setDrafts((current) => current.map((entry) => entry.id === id ? { ...entry, [field]: value } : entry));
  const addStop = () => setDrafts((current) => [...current, createItineraryEntry(destination, date)]);
  const cancel = () => { setDrafts(entries); setEditing(false); };

  return (
    <section className="timeline-day" style={{ '--timeline-index': dayNumber ?? 0 } as CSSProperties}>
      <div className="timeline-day__label"><span>{date === 'unplanned' ? 'Unscheduled' : `Day ${dayNumber}`}</span><h2>{date === 'unplanned' ? 'Stops without a date' : dateLabel(date)}</h2><i />{date !== 'unplanned' && <button type="button" className="timeline-day__edit" onClick={() => setEditing(true)}><PencilLine size={14} /> {entries.length ? 'Edit day' : 'Plan day'}</button>}</div>
      {editing ? (
        <div className="timeline-day-editor">
          {drafts.map((entry, index) => <div className="timeline-card-editor" key={entry.id}><div className="timeline-card-editor__title"><span>Stop {index + 1}</span><strong>{entry.placeOfInterest || 'New stop'}</strong></div><div className="timeline-card-editor__grid">
            <label><span>Start</span><input type="time" value={entry.startTime} onChange={(event) => update(entry.id, 'startTime', event.target.value)} /></label><label><span>End</span><input type="time" value={entry.endTime} onChange={(event) => update(entry.id, 'endTime', event.target.value)} /></label><label><span>Duration</span><input value={entry.duration} onChange={(event) => update(entry.id, 'duration', event.target.value)} /></label><label><span>Cost (SGD)</span><input inputMode="decimal" value={entry.actualCostSgd} onChange={(event) => update(entry.id, 'actualCostSgd', event.target.value)} /></label>
            <label className="timeline-card-editor__wide"><span>Place or event</span><input value={entry.placeOfInterest} onChange={(event) => update(entry.id, 'placeOfInterest', event.target.value)} /></label><label><span>Category</span><select value={entry.category} onChange={(event) => update(entry.id, 'category', event.target.value)}><option>Sightseeing</option><option>Food & drink</option><option>Stay</option><option>Transport</option><option>Wellness</option><option>Shopping</option><option>Other</option></select></label><label><span>How was it?</span><input value={entry.howWasIt} onChange={(event) => update(entry.id, 'howWasIt', event.target.value)} /></label>
            <label className="timeline-card-editor__wide"><span>Getting there</span><input value={entry.transitMode} onChange={(event) => update(entry.id, 'transitMode', event.target.value)} /></label><label className="timeline-card-editor__wide"><span>Notes</span><textarea value={entry.notes} onChange={(event) => update(entry.id, 'notes', event.target.value)} rows={2} /></label>
          </div></div>)}
          <div className="timeline-card-editor__actions"><button type="button" onClick={addStop}>Add stop</button><button type="button" onClick={cancel}>Cancel</button><button type="button" onClick={() => { onUpdateEntries(drafts); setEditing(false); }}>Save day</button></div>
        </div>
      ) : <div className="timeline-stops">{entries.length === 0 && date !== 'unplanned' ? <button type="button" className="timeline-day-placeholder" onClick={() => { setDrafts([createItineraryEntry(destination, date)]); setEditing(true); }}><Sparkles size={18} /><strong>Unplanned day</strong><span>Add the first stop for {dateLabel(date)}.</span></button> : entries.map((entry, index) => <div key={entry.id}>{index > 0 && <JourneyTransfer entry={entry} previous={entries[index - 1]} />}<TimelineStop entry={entry} index={index} isLast={index === entries.length - 1} /></div>)}</div>}
    </section>
  );
}

export function TripTimelineModal({ trip, onDismiss, onEdit, onUpdateEntries, onAskAssistant }: TripTimelineModalProps) {
  const entries = orderedEntries(trip.itinerary);
  const flights = displayedFlightLegs(entries);
  const timelineDays = buildTimelineDays(trip, entries);
  const [activeDate, setActiveDate] = useState(() => timelineDays[0]?.[0] ?? '');
  const activeDay = timelineDays.find(([date]) => date === activeDate) ?? timelineDays[0];

  return (
    <div className="timeline-overlay" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onDismiss()}>
      <section className="timeline-dialog" role="dialog" aria-modal="true" aria-label={`${trip.title} itinerary`}>
        <header className="timeline-hero">
          <div className="timeline-hero__orb" aria-hidden="true"><Sparkles size={22} /></div>
          <div className="timeline-hero__copy">
            <span>Private itinerary · {trip.destination}</span>
            <h1>{trip.title}</h1>
            <p>{trip.travelers || 'Traveller count to be confirmed'} · {entries.length} {entries.length === 1 ? 'planned moment' : 'planned moments'}</p>
          </div>
          <div className="timeline-hero__actions">
            {onAskAssistant && <button type="button" className="timeline-ai" onClick={onAskAssistant}><Sparkles size={15} /> AI plan</button>}
            <button type="button" className="timeline-close" onClick={onDismiss} aria-label="Close itinerary"><X size={19} /></button>
          </div>
        </header>

        <div className="timeline-summary">
          <div><CalendarDays size={17} /><span>Travel window</span><strong>{dateLabel(trip.startDate)}{trip.endDate && trip.endDate !== trip.startDate ? ` → ${dateLabel(trip.endDate)}` : ''}</strong></div>
          <div><MapPin size={17} /><span>Stay</span><strong>{trip.hotel?.name || 'Accommodation to be planned'}</strong><small>{trip.hotel?.address || 'Address to be added'}</small></div>
          <div>
            <ReceiptText size={17} />
            <span>{flights.length > 1 ? 'Flights' : 'Flight'}</span>
            <div className="timeline-flight-legs">
              {flights.map((flight) => <div key={flight.id}><b>{flight.label}</b><strong>{flight.flight}</strong><small>{flight.route}<br />{flight.when}</small></div>)}
            </div>
          </div>
        </div>

        <main className="timeline-body">
          {timelineDays.length === 0 ? (
            <button type="button" className="timeline-empty" onClick={onEdit}><Sparkles size={22} /><strong>Shape the first day</strong><span>This journey is ready for dates, stays, flights and every stop along the way.</span></button>
          ) : <><nav className="timeline-day-tabs" aria-label="Itinerary days">{timelineDays.map(([date], index) => <button type="button" key={date} className={date === activeDay?.[0] ? 'is-active' : ''} onClick={() => setActiveDate(date)}><span>{date === 'unplanned' ? 'Unscheduled' : `Day ${index + 1}`}</span><strong>{date === 'unplanned' ? 'No date' : dateLabel(date)}</strong></button>)}</nav>{activeDay && <TimelineDay date={activeDay[0]} dayNumber={activeDay[0] === 'unplanned' ? undefined : timelineDays.findIndex(([date]) => date === activeDay[0]) + 1} entries={activeDay[1]} destination={trip.destination} onUpdateEntries={onUpdateEntries} />}</>}
        </main>
      </section>
    </div>
  );
}
