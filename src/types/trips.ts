export interface TripDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
}

export interface ItineraryEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  destination: string;
  placeOfInterest: string;
  category: string;
  price: string;
  currency: string;
  distanceKm: string;
  transitMode: string;
  link: string;
  notes: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  notes: string;
  itinerary: ItineraryEntry[];
  documents: TripDocument[];
  createdAt: string;
  updatedAt: string;
}
