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
  duration: string;
  destination: string;
  placeOfInterest: string;
  category: string;
  verification: string;
  actualCostSgd: string;
  manualActualCostSgd: string;
  howWasIt: string;
  googleMapsLink: string;
  distanceKm: string;
  transitMode: string;
  notes: string;
}

export interface StayDetails {
  name: string;
  fromDate: string;
  toDate: string;
  address: string;
  pricePaidSgd: string;
}

export interface FlightDetails {
  airline: string;
  flightNumber: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  pricePaidSgd: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  notes: string;
  hotel: StayDetails;
  flight: FlightDetails;
  itinerary: ItineraryEntry[];
  documents: TripDocument[];
  createdAt: string;
  updatedAt: string;
}
