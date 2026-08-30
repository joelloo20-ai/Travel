import type { Trip } from '../types/trips';

const SHEET_ENDPOINT_KEY = 'atlas-sheet-endpoint-v1';
// This is the deployed endpoint for the shared travel workbook. Keeping it as a
// fallback means the dashboard works on a fresh browser as well as on the one
// where the endpoint was first configured.
const DEFAULT_SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzIvxz74pxzlvwR55h85omSOQtu8jUVgrDHib3v9xytHgKHRCr0QzqCOw2WLrKh2OLFVQ/exec';

export function getSheetEndpoint(): string {
  return window.localStorage.getItem(SHEET_ENDPOINT_KEY) ?? import.meta.env.VITE_SHEETS_SYNC_URL ?? DEFAULT_SHEET_ENDPOINT;
}

export function saveSheetEndpoint(endpoint: string): void {
  window.localStorage.setItem(SHEET_ENDPOINT_KEY, endpoint.trim().replace(/\/$/, ''));
}

export async function fetchSheetTrips(endpoint = getSheetEndpoint()): Promise<Trip[]> {
  if (!endpoint) throw new Error('Add your deployed Apps Script web-app URL first.');
  const payload = await loadJsonp<{ ok?: boolean; trips?: Trip[]; error?: string }>(endpoint, { action: 'trips' });
  if (!payload.ok || !Array.isArray(payload.trips)) throw new Error(payload.error || 'The endpoint returned an invalid response.');
  return payload.trips.map(enrichSheetTrip);
}

function toIsoDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function enrichSheetTrip(trip: Trip): Trip {
  const itinerary = trip.itinerary.map((entry) => ({ ...entry, date: toIsoDate(entry.date) || entry.date }));
  const datedEntries = itinerary.filter((entry) => Boolean(toIsoDate(entry.date)));
  const dates = datedEntries.map((entry) => entry.date).sort();
  const flightEntries = datedEntries.filter((entry) => entry.category.toLowerCase() === 'transport' && /\bflight\b|\bTR\s?\d+\b|\bSQ\s?\d+\b/i.test(entry.placeOfInterest));
  const firstFlight = flightEntries[0];
  const lastFlight = flightEntries.at(-1);
  const firstFlightMatch = firstFlight?.placeOfInterest.match(/^(.+?)\s*[·-]\s*(.+)$/);
  const lastFlightMatch = lastFlight?.placeOfInterest.match(/^(.+?)\s*[·-]\s*(.+)$/);
  const airline = trip.flight?.airline || firstFlightMatch?.[1].replace(/\s+[A-Z]{1,3}\s?\d+.*$/, '').trim() || '';
  const flightNumbers = [firstFlightMatch?.[1], lastFlightMatch?.[1]].filter(Boolean);
  const flightNumber = trip.flight?.flightNumber || [...new Set(flightNumbers)].join(' / ');
  const route = trip.flight?.route || firstFlightMatch?.[2] || '';

  return {
    ...trip,
    itinerary,
    startDate: firstFlight?.date || trip.startDate || dates[0] || '',
    endDate: lastFlight?.date || trip.endDate || dates.at(-1) || '',
    flight: {
      ...trip.flight,
      airline,
      flightNumber,
      route,
      departureTime: trip.flight?.departureTime || (firstFlight && isTime(firstFlight.startTime) ? `${firstFlight.date}T${firstFlight.startTime}` : ''),
      arrivalTime: trip.flight?.arrivalTime || (lastFlight && isTime(lastFlight.endTime) ? `${lastFlight.date}T${lastFlight.endTime}` : ''),
    },
  };
}

function loadJsonp<T>(endpoint: string, parameters: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    const callback = `atlasSheetCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const callbackWindow = window as unknown as Record<string, unknown>;
    const url = new URL(endpoint);
    Object.entries({ ...parameters, callback }).forEach(([key, value]) => url.searchParams.set(key, value));
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => finish(new Error('The Google Sheet endpoint took too long to respond.')), 12000);
    const finish = (error?: Error, value?: T) => {
      window.clearTimeout(timeout);
      script.remove();
      delete callbackWindow[callback];
      if (error) reject(error);
      else resolve(value as T);
    };
    callbackWindow[callback] = (value: T) => finish(undefined, value);
    script.onerror = () => finish(new Error('The Google Sheet endpoint could not be reached.'));
    script.src = url.toString();
    document.head.append(script);
  });
}

export async function syncTripToSheet(trip: Trip, endpoint = getSheetEndpoint()): Promise<void> {
  if (!endpoint) throw new Error('Add your deployed Apps Script web-app URL first.');
  await fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'syncTrip', trip }),
    redirect: 'follow',
  });
  const syncedTrips = await fetchSheetTrips(endpoint);
  const syncedTrip = syncedTrips.find((item) => item.destination.trim().toLowerCase() === trip.destination.trim().toLowerCase());
  if (!syncedTrip) throw new Error('The sheet did not confirm this trip after saving. Check the Apps Script deployment.');
  const expectedIds = new Set(trip.itinerary.map((entry) => entry.id));
  const returnedIds = new Set(syncedTrip.itinerary.map((entry) => entry.id));
  if ([...expectedIds].some((id) => !returnedIds.has(id))) {
    throw new Error('The sheet did not confirm every itinerary record after saving.');
  }
}
