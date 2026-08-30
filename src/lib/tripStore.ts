import type { ItineraryEntry, Trip, TripDocument } from '../types/trips';

const STORAGE_KEY = 'atlas-trips-v1';

export function makeId(prefix: string): string {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${id}`;
}

export function createItineraryEntry(destination = '', date = ''): ItineraryEntry {
  return {
    id: makeId('activity'),
    date,
    startTime: '',
    endTime: '',
    duration: '',
    destination,
    placeOfInterest: '',
    category: 'Sightseeing',
    verification: 'Pending form verification',
    actualCostSgd: '',
    manualActualCostSgd: '',
    howWasIt: '',
    googleMapsLink: '',
    distanceKm: '',
    transitMode: '',
    notes: '',
  };
}

export function getTrips(): Trip[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Trip[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTrips(trips: Trip[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function upsertTrip(trip: Trip): Trip[] {
  const trips = getTrips();
  const existing = trips.findIndex((item) => item.id === trip.id);
  const next = existing === -1
    ? [trip, ...trips]
    : trips.map((item) => (item.id === trip.id ? trip : item));

  saveTrips(next);
  return next;
}

function csvCell(value: string | number | undefined): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function formatSheetDate(date: string): string {
  if (!date) return '';
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat('en-SG', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}

function formatSheetTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const period = hours >= 12 ? 'pm' : 'am';
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, '0')}${period}`;
}

export function makeTripCsv(trip: Trip): string {
  const header = [
    'Trip',
    'Start date',
    'End date',
    'Travelers',
    'Hotel name',
    'Hotel from date',
    'Hotel to date',
    'Hotel address',
    'Hotel price paid (SGD)',
    'Airline',
    'Flight number',
    'Flight route',
    'Flight departure',
    'Flight arrival',
    'Flight price paid (SGD)',
    'Day & Date',
    'Time Range',
    'Duration',
    'Travel from last stop',
    'Distance (km)',
    'Category',
    'Planned Item',
    'Verified from Google Form',
    'Actual Cost (SGD)',
    'Manual Actual Cost (SGD)',
    'How was it?',
    'Google Maps',
    'Notes',
  ];
  const entries = trip.itinerary.length ? trip.itinerary : [createItineraryEntry(trip.destination, trip.startDate)];
  const rows = entries.map((entry) => [
    trip.title,
    trip.startDate,
    trip.endDate,
    trip.travelers,
    trip.hotel?.name ?? '',
    trip.hotel?.fromDate ?? '',
    trip.hotel?.toDate ?? '',
    trip.hotel?.address ?? '',
    trip.hotel?.pricePaidSgd ?? '',
    trip.flight?.airline ?? '',
    trip.flight?.flightNumber ?? '',
    trip.flight?.route ?? '',
    trip.flight?.departureTime ?? '',
    trip.flight?.arrivalTime ?? '',
    trip.flight?.pricePaidSgd ?? '',
    formatSheetDate(entry.date),
    entry.startTime && entry.endTime ? `${formatSheetTime(entry.startTime)} - ${formatSheetTime(entry.endTime)}` : formatSheetTime(entry.startTime || entry.endTime),
    entry.duration,
    entry.transitMode,
    entry.distanceKm,
    entry.category,
    entry.placeOfInterest,
    entry.verification,
    entry.actualCostSgd,
    entry.manualActualCostSgd,
    entry.howWasIt,
    entry.googleMapsLink,
    entry.notes,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export function downloadTripCsv(trip: Trip): void {
  const safeTitle = trip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'trip';
  const blob = new Blob([makeTripCsv(trip)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeTitle}-itinerary.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function createTripDocument(file: File): TripDocument {
  return {
    id: makeId('document'),
    name: file.name,
    type: file.type || 'file',
    size: file.size,
    addedAt: new Date().toISOString(),
  };
}
