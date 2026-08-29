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
    destination,
    placeOfInterest: '',
    category: 'Sightseeing',
    price: '',
    currency: 'SGD',
    distanceKm: '',
    transitMode: '',
    link: '',
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

export function makeTripCsv(trip: Trip): string {
  const header = [
    'Trip',
    'Start date',
    'End date',
    'Travelers',
    'Date',
    'Start time',
    'End time',
    'Destination',
    'Place of interest',
    'Category',
    'Price',
    'Currency',
    'Distance from previous activity (km)',
    'Transit mode',
    'Link',
    'Activity notes',
    'Trip notes',
    'Document references',
  ];
  const documentReferences = trip.documents.map((document) => document.name).join(' | ');
  const entries = trip.itinerary.length ? trip.itinerary : [createItineraryEntry(trip.destination, trip.startDate)];
  const rows = entries.map((entry) => [
    trip.title,
    trip.startDate,
    trip.endDate,
    trip.travelers,
    entry.date,
    entry.startTime,
    entry.endTime,
    entry.destination,
    entry.placeOfInterest,
    entry.category,
    entry.price,
    entry.currency,
    entry.distanceKm,
    entry.transitMode,
    entry.link,
    entry.notes,
    trip.notes,
    documentReferences,
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
