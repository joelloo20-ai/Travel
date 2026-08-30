import { createItineraryEntry, makeId } from './tripStore';
import type { ItineraryEntry, Trip } from '../types/trips';
import type { PublicPlace } from './publicPlaceResearch';

export const ITINERARY_ASSISTANT_INSTRUCTION = `Build a practical itinerary for any destination. Use the hotel as the daily anchor, cluster activities by nearby neighbourhood, and choose the shortest sensible travel sequence between each stop. Start the day no earlier than 9:00 am. Schedule Bel's daily 5 km run first at a nearby park or the hotel gym if a park is not practical. Always include a final return to the hotel and never schedule the day beyond 12:00 midnight. Allow realistic travel and meal breaks, and mark anything that needs booking or local verification.`;

type ActivitySeed = Pick<ItineraryEntry, 'startTime' | 'endTime' | 'duration' | 'placeOfInterest' | 'category' | 'transitMode' | 'distanceKm' | 'notes'>;

const dayPlan: ActivitySeed[] = [
  { startTime: '09:00', endTime: '09:45', duration: '45 min · 5 km', placeOfInterest: '5 km run — nearby park or hotel gym', category: 'Wellness', transitMode: 'Walk from hotel', distanceKm: '', notes: 'Choose the nearest safe park route; use the hotel gym as the weather backup.' },
  { startTime: '10:30', endTime: '12:00', duration: '1h 30m', placeOfInterest: 'Morning activity — closest neighbourhood cluster', category: 'Sightseeing', transitMode: 'Short walk or transit from hotel', distanceKm: '', notes: 'Choose one bookable highlight close to the hotel or the next stop.' },
  { startTime: '12:15', endTime: '13:30', duration: '1h 15m', placeOfInterest: 'Lunch near the morning activity', category: 'Food & drink', transitMode: '5–15 min walk', distanceKm: '', notes: 'Avoid crossing the city for lunch.' },
  { startTime: '14:15', endTime: '16:30', duration: '2h 15m', placeOfInterest: 'Afternoon activity — same neighbourhood', category: 'Sightseeing', transitMode: 'Short walk or one direct ride', distanceKm: '', notes: 'Keep this in the same district as lunch where possible.' },
  { startTime: '18:30', endTime: '20:30', duration: '2h', placeOfInterest: 'Dinner close to hotel or final activity', category: 'Food & drink', transitMode: 'Short walk or one direct ride', distanceKm: '', notes: 'Choose the location with the shortest safe return to the hotel.' },
];

const melbourneDays: ActivitySeed[][] = [
  [
    { startTime: '09:00', endTime: '10:15', duration: '1h 15m', placeOfInterest: 'Queen Victoria Market breakfast wander', category: 'Food & drink', transitMode: 'Walk or tram from hotel', distanceKm: '1.2', notes: 'Start with coffee and market breakfast. Check opening hours before setting off.' },
    { startTime: '10:35', endTime: '12:15', duration: '1h 40m', placeOfInterest: 'Melbourne laneways — Hosier Lane, AC/DC Lane & Centre Place', category: 'Sightseeing', transitMode: '10 min tram or 20 min walk', distanceKm: '1.6', notes: 'Follow the street-art and arcade circuit at an easy pace.' },
    { startTime: '12:30', endTime: '13:45', duration: '1h 15m', placeOfInterest: 'Chinatown dumpling lunch', category: 'Food & drink', transitMode: '6 min walk', distanceKm: '0.4', notes: 'Keep this lunch close to the CBD route.' },
    { startTime: '14:15', endTime: '16:30', duration: '2h 15m', placeOfInterest: 'NGV International & St Kilda Road arts precinct', category: 'Sightseeing', transitMode: '12 min tram', distanceKm: '2.1', notes: 'General collection access is often free; check special exhibition tickets.' },
    { startTime: '18:45', endTime: '21:00', duration: '2h 15m', placeOfInterest: 'Dinner — Gimlet or Flower Drum', category: 'Food & drink', transitMode: '10 min tram or ride', distanceKm: '2.0', notes: 'Book ahead for a date-night table.' },
  ],
  [
    { startTime: '09:30', endTime: '10:30', duration: '1h', placeOfInterest: 'Carlton Gardens morning walk', category: 'Wellness', transitMode: 'Tram from hotel', distanceKm: '2.3', notes: 'A relaxed green start before the museum.' },
    { startTime: '10:45', endTime: '13:00', duration: '2h 15m', placeOfInterest: 'Melbourne Museum & Royal Exhibition Building', category: 'Sightseeing', transitMode: '5 min walk', distanceKm: '0.3', notes: 'Allow extra time for temporary exhibitions.' },
    { startTime: '13:15', endTime: '14:30', duration: '1h 15m', placeOfInterest: 'Lygon Street Italian lunch', category: 'Food & drink', transitMode: '8 min walk', distanceKm: '0.6', notes: 'Choose a trattoria with outdoor seating if weather permits.' },
    { startTime: '15:00', endTime: '17:00', duration: '2h', placeOfInterest: 'State Library Victoria & La Trobe Reading Room', category: 'Sightseeing', transitMode: '12 min walk', distanceKm: '0.9', notes: 'A beautiful low-key afternoon close to the CBD.' },
    { startTime: '19:00', endTime: '21:00', duration: '2h', placeOfInterest: 'Rooftop drinks & laneway dinner', category: 'Food & drink', transitMode: '10 min walk', distanceKm: '0.7', notes: 'Keep the evening in the city rather than crossing town.' },
  ],
  [
    { startTime: '09:00', endTime: '10:30', duration: '1h 30m', placeOfInterest: 'Royal Botanic Gardens & Shrine of Remembrance', category: 'Sightseeing', transitMode: 'Tram from hotel', distanceKm: '2.6', notes: 'A calm, highly walkable morning through the gardens.' },
    { startTime: '11:00', endTime: '12:15', duration: '1h 15m', placeOfInterest: 'Yarra River walk to Southbank', category: 'Wellness', transitMode: '20 min walk', distanceKm: '1.5', notes: 'Follow the river north for skyline and public-art views.' },
    { startTime: '12:30', endTime: '13:45', duration: '1h 15m', placeOfInterest: 'Southbank lunch', category: 'Food & drink', transitMode: '5 min walk', distanceKm: '0.3', notes: 'Choose a waterside table; reserve at weekends.' },
    { startTime: '14:15', endTime: '16:30', duration: '2h 15m', placeOfInterest: 'ACMI at Federation Square', category: 'Sightseeing', transitMode: '12 min walk', distanceKm: '0.9', notes: 'Pair with the Ian Potter Centre if you want more art.' },
    { startTime: '18:45', endTime: '21:00', duration: '2h 15m', placeOfInterest: 'Yarra dinner cruise or riverside date night', category: 'Food & drink', transitMode: '8 min walk', distanceKm: '0.5', notes: 'Book a cruise in advance; use a Southbank restaurant as the flexible alternative.' },
  ],
  [
    { startTime: '10:00', endTime: '11:30', duration: '1h 30m', placeOfInterest: 'Fitzroy & Gertrude Street design walk', category: 'Sightseeing', transitMode: 'Tram from hotel', distanceKm: '2.8', notes: 'Browse independent shops, galleries and record stores.' },
    { startTime: '11:45', endTime: '13:00', duration: '1h 15m', placeOfInterest: 'Brunswick Street brunch', category: 'Food & drink', transitMode: '8 min walk', distanceKm: '0.5', notes: 'Keep a flexible table for a slow morning.' },
    { startTime: '13:30', endTime: '15:30', duration: '2h', placeOfInterest: 'Rose Street Artists’ Market or Fitzroy galleries', category: 'Shopping', transitMode: '10 min walk', distanceKm: '0.7', notes: 'The market is weekend-dependent; swap in galleries on weekdays.' },
    { startTime: '16:00', endTime: '17:30', duration: '1h 30m', placeOfInterest: 'Collingwood coffee & creative precinct', category: 'Sightseeing', transitMode: '12 min walk', distanceKm: '0.9', notes: 'Stay local; this is a deliberately unhurried afternoon.' },
    { startTime: '19:00', endTime: '21:15', duration: '2h 15m', placeOfInterest: 'Fitzroy date-night dinner', category: 'Food & drink', transitMode: 'Short walk', distanceKm: '0.4', notes: 'Reserve a neighbourhood restaurant or wine bar.' },
  ],
  [
    { startTime: '10:00', endTime: '11:30', duration: '1h 30m', placeOfInterest: 'St Kilda foreshore & pier walk', category: 'Sightseeing', transitMode: 'Direct tram from hotel', distanceKm: '6.5', notes: 'Go in daylight; check weather before committing to the beach.' },
    { startTime: '12:00', endTime: '13:15', duration: '1h 15m', placeOfInterest: 'St Kilda beachside lunch', category: 'Food & drink', transitMode: '8 min walk', distanceKm: '0.6', notes: 'Pick a relaxed cafe near the esplanade.' },
    { startTime: '13:30', endTime: '15:30', duration: '2h', placeOfInterest: 'St Kilda Esplanade Market or beach afternoon', category: 'Shopping', transitMode: '5 min walk', distanceKm: '0.3', notes: 'The market runs on Sundays; otherwise take the coastal walk.' },
    { startTime: '16:00', endTime: '17:30', duration: '1h 30m', placeOfInterest: 'Sunset at St Kilda Pier', category: 'Sightseeing', transitMode: '15 min walk', distanceKm: '1.1', notes: 'Stay after dusk for the penguin viewing area, respecting local guidance.' },
    { startTime: '19:00', endTime: '21:00', duration: '2h', placeOfInterest: 'St Kilda dinner & drinks', category: 'Food & drink', transitMode: '10 min walk', distanceKm: '0.8', notes: 'An easy beachside end to the day.' },
  ],
  [
    { startTime: '09:30', endTime: '11:00', duration: '1h 30m', placeOfInterest: 'South Melbourne Market breakfast', category: 'Food & drink', transitMode: 'Tram from hotel', distanceKm: '3.2', notes: 'A local market morning; check trading days.' },
    { startTime: '11:20', endTime: '13:00', duration: '1h 40m', placeOfInterest: 'Albert Park Lake walk', category: 'Wellness', transitMode: '15 min walk', distanceKm: '1.2', notes: 'An easy waterside route after the market.' },
    { startTime: '13:30', endTime: '14:45', duration: '1h 15m', placeOfInterest: 'South Melbourne seafood lunch', category: 'Food & drink', transitMode: '12 min walk', distanceKm: '0.9', notes: 'Choose a market-side table.' },
    { startTime: '15:30', endTime: '17:30', duration: '2h', placeOfInterest: 'National Gallery of Victoria or Shrine revisit', category: 'Sightseeing', transitMode: '12 min tram', distanceKm: '2.4', notes: 'Use this as a weather-proof culture block.' },
    { startTime: '19:00', endTime: '21:15', duration: '2h 15m', placeOfInterest: 'Southbank dinner date', category: 'Food & drink', transitMode: '10 min tram', distanceKm: '2.0', notes: 'Book a river-view restaurant for an evening together.' },
  ],
  [
    { startTime: '08:30', endTime: '18:30', duration: '10h', placeOfInterest: 'Yarra Valley winery day trip', category: 'Sightseeing', transitMode: 'Pre-booked coach or hire car', distanceKm: '60', notes: 'Book a guided tasting day so neither of you drives. Confirm cellar-door and lunch reservations.' },
    { startTime: '19:30', endTime: '21:00', duration: '1h 30m', placeOfInterest: 'Easy hotel-neighbourhood dinner', category: 'Food & drink', transitMode: 'Short walk from hotel', distanceKm: '0.6', notes: 'Keep the evening deliberately light after the day trip.' },
  ],
  [
    { startTime: '08:00', endTime: '19:00', duration: '11h', placeOfInterest: 'Great Ocean Road small-group day trip', category: 'Sightseeing', transitMode: 'Pre-booked coach or hire car', distanceKm: '240', notes: 'A long but spectacular day. Choose a small-group route and confirm pickup time.' },
    { startTime: '20:00', endTime: '21:00', duration: '1h', placeOfInterest: 'Hotel room service or nearby supper', category: 'Food & drink', transitMode: 'Walk from hotel', distanceKm: '0.2', notes: 'Do not over-schedule the evening after the coast.' },
  ],
  [
    { startTime: '10:00', endTime: '11:30', duration: '1h 30m', placeOfInterest: 'Prahran Market brunch', category: 'Food & drink', transitMode: 'Tram from hotel', distanceKm: '4.4', notes: 'A food-focused morning in a different neighbourhood.' },
    { startTime: '12:00', endTime: '13:30', duration: '1h 30m', placeOfInterest: 'Chapel Street design and vintage browse', category: 'Shopping', transitMode: '10 min walk', distanceKm: '0.8', notes: 'Keep the route centred around Prahran and Windsor.' },
    { startTime: '14:00', endTime: '16:30', duration: '2h 30m', placeOfInterest: 'Sense of Self bathhouse or couples’ reset', category: 'Wellness', transitMode: '20 min tram', distanceKm: '3.1', notes: 'Booking essential; replace with a cafe and gallery if you prefer.' },
    { startTime: '19:00', endTime: '21:30', duration: '2h 30m', placeOfInterest: 'Final Melbourne celebration dinner', category: 'Food & drink', transitMode: 'Ride or tram', distanceKm: '3.5', notes: 'Reserve your favourite restaurant from the trip for the finale.' },
  ],
  [
    { startTime: '10:00', endTime: '11:30', duration: '1h 30m', placeOfInterest: 'Federation Square & Koorie Heritage Trust', category: 'Sightseeing', transitMode: 'Tram from hotel', distanceKm: '1.8', notes: 'A meaningful cultural afternoon anchored in the CBD.' },
    { startTime: '12:00', endTime: '13:15', duration: '1h 15m', placeOfInterest: 'CBD cafe lunch', category: 'Food & drink', transitMode: '6 min walk', distanceKm: '0.4', notes: 'Choose a cafe in the laneways or Flinders Lane.' },
    { startTime: '14:00', endTime: '16:00', duration: '2h', placeOfInterest: 'Block Arcade, Royal Arcade & Collins Street', category: 'Shopping', transitMode: '12 min walk', distanceKm: '0.9', notes: 'A polished final walk through Melbourne’s historic arcades.' },
    { startTime: '17:00', endTime: '18:30', duration: '1h 30m', placeOfInterest: 'Sunset drink at a CBD rooftop', category: 'Food & drink', transitMode: '10 min walk', distanceKm: '0.6', notes: 'Make this a flexible goodbye-to-Melbourne moment.' },
  ],
];

function addDays(date: string, offset: number): string {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + offset);
  return Number.isNaN(next.getTime()) ? date : next.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  const difference = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
  return Number.isFinite(difference) && difference >= 0 ? difference + 1 : 1;
}

function createEntry(seed: ActivitySeed, date: string, destination: string): ItineraryEntry {
  return { ...createItineraryEntry(destination, date), ...seed, id: makeId('activity'), verification: 'Suggested — verify locally' };
}

export function generateItinerary(trip: Pick<Trip, 'destination' | 'startDate' | 'endDate' | 'hotel'>): ItineraryEntry[] {
  const numberOfDays = daysBetween(trip.startDate, trip.endDate);
  const entries: ItineraryEntry[] = [];

  for (let day = 0; day < numberOfDays; day += 1) {
    const date = addDays(trip.startDate, day);
    const placeSpecificPlan = trip.destination.toLowerCase().includes('melbourne') ? melbourneDays[day % melbourneDays.length] : dayPlan;
    placeSpecificPlan.forEach((seed) => entries.push(createEntry(seed, date, trip.destination)));
    entries.push(createEntry({
      startTime: '21:00', endTime: '21:30', duration: '30 min', placeOfInterest: `Return to ${trip.hotel.name || 'hotel'}`,
      category: 'Stay', transitMode: 'Short ride or walk', distanceKm: '', notes: 'Daily finish at the hotel — itinerary closes well before midnight.',
    }, date, trip.destination));
  }

  return entries;
}

export async function generateItineraryWithModel(trip: Pick<Trip, 'destination' | 'startDate' | 'endDate' | 'hotel' | 'flight' | 'travelers'>): Promise<{ itinerary: ItineraryEntry[]; source: 'model' | 'research plan' }> {
  try {
    const response = await fetch('/api/itinerary-assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip }),
    });
    if (!response.ok) throw new Error('Model is not configured');
    const result = await response.json() as { itinerary?: ItineraryEntry[] };
    if (!Array.isArray(result.itinerary) || !result.itinerary.length) throw new Error('Model returned no itinerary');
    return { itinerary: result.itinerary.map((entry) => ({ ...createItineraryEntry(trip.destination, entry.date), ...entry, id: makeId('activity'), destination: trip.destination, verification: 'AI suggestion — verify locally' })), source: 'model' };
  } catch {
    return { itinerary: generateItinerary(trip), source: 'research plan' };
  }
}

export function generateResearchedItinerary(trip: Pick<Trip, 'destination' | 'startDate' | 'endDate' | 'hotel'>, places: PublicPlace[]): ItineraryEntry[] {
  const parks = places.filter((place) => place.kind === 'park');
  const sights = places.filter((place) => place.kind === 'sight');
  const food = places.filter((place) => place.kind === 'food');
  const entries = generateItinerary(trip);
  return entries.map((entry, index) => {
    const dailyIndex = index % 6;
    const place = dailyIndex === 0 ? parks[index % Math.max(parks.length, 1)] : dailyIndex === 1 || dailyIndex === 3 ? sights[index % Math.max(sights.length, 1)] : dailyIndex === 2 || dailyIndex === 4 ? food[index % Math.max(food.length, 1)] : undefined;
    if (!place) return entry;
    const reels = `https://www.tiktok.com/search?q=${encodeURIComponent(`${place.name} ${trip.destination} travel reel`)}`;
    return { ...entry, placeOfInterest: place.name, googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${trip.destination}`)}`, notes: `Public map recommendation. Check recent TikTok reels before booking: ${reels}` };
  });
}
