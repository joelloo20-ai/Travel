import { useEffect, useState } from 'react';
import type { Destination } from '../data/destinations';

export interface BriefingStory { title: string; url: string; source: string; }
export interface BriefingPlace { name: string; kind: string; latitude: number; longitude: number; imageUrl?: string; }

interface BriefingState {
  news: BriefingStory[];
  places: BriefingPlace[];
  food: BriefingPlace[];
  loading: boolean;
  hasLivePlaces: boolean;
}

const EMPTY_BRIEFING: BriefingState = { news: [], places: [], food: [], loading: true, hasLivePlaces: false };
const PLACE_TYPES: Record<string, string> = { attraction: 'Attraction', gallery: 'Gallery', museum: 'Museum', park: 'Park', viewpoint: 'Viewpoint', zoo: 'Zoo', artwork: 'Landmark', monument: 'Monument', memorial: 'Memorial' };

// Keep the product interface in English without pretending to translate a
// venue name. When OSM has no English name tag, the item is skipped and the
// destination's English editorial fallback remains available instead.
function isEnglishDisplayName(value: string): boolean {
  return !/[^\u0000-\u024f\u1e00-\u1eff\s'’.,()&/\-\d]/u.test(value);
}

function fallbackPlaces(destination: Destination): BriefingPlace[] {
  return destination.recommendations.map((recommendation, index) => ({
    name: recommendation.title, kind: recommendation.tag,
    latitude: destination.latitude + index * 0.001, longitude: destination.longitude + index * 0.001,
  }));
}

async function fetchNews(destination: Destination, signal: AbortSignal): Promise<BriefingStory[]> {
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', `"${destination.name}" language:english`);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', '3');
  url.searchParams.set('timespan', '7d');
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`News request failed: ${response.status}`);
  const data = await response.json() as { articles?: Array<{ title?: string; url?: string; domain?: string }> };
  return (data.articles ?? []).flatMap((article) => article.title && article.url && article.domain ? [{ title: article.title, url: article.url, source: article.domain }] : []).slice(0, 3);
}

async function fetchPlaces(destination: Destination, signal: AbortSignal): Promise<BriefingPlace[]> {
  const query = `[out:json][timeout:12];(nwr["tourism"~"attraction|gallery|museum|viewpoint|zoo"](around:6000,${destination.latitude},${destination.longitude});nwr["leisure"="park"](around:6000,${destination.latitude},${destination.longitude});nwr["historic"~"monument|memorial"](around:6000,${destination.latitude},${destination.longitude}););out center 12;`;
  const url = new URL('https://overpass-api.de/api/interpreter');
  url.searchParams.set('data', query);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Places request failed: ${response.status}`);
  const data = await response.json() as { elements?: Array<{ tags?: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number } }> };
  const seen = new Set<string>();
  const places = (data.elements ?? []).flatMap((element) => {
    const name = element.tags?.['name:en'] ?? element.tags?.name;
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (!name || !isEnglishDisplayName(name) || latitude === undefined || longitude === undefined || seen.has(name)) return [];
    seen.add(name);
    const tag = element.tags?.tourism ?? element.tags?.leisure ?? element.tags?.historic ?? 'attraction';
    return [{ name, latitude, longitude, kind: PLACE_TYPES[tag] ?? 'Place of interest' }];
  }).slice(0, 3);
  const placesWithImages = await Promise.all(places.map(async (place) => ({
    ...place,
    imageUrl: await fetchPlaceImage(place.name, signal),
  })));
  return placesWithImages;
}

async function fetchFood(destination: Destination, signal: AbortSignal): Promise<BriefingPlace[]> {
  const query = `[out:json][timeout:12];(nwr["amenity"~"restaurant|cafe|fast_food|food_court"](around:6000,${destination.latitude},${destination.longitude}););out center 18;`;
  const url = new URL('https://overpass-api.de/api/interpreter');
  url.searchParams.set('data', query);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Food request failed: ${response.status}`);
  const data = await response.json() as { elements?: Array<{ tags?: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number } }> };
  const seen = new Set<string>();
  const food = (data.elements ?? []).flatMap((element) => {
    const name = element.tags?.['name:en'] ?? element.tags?.name;
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (!name || !isEnglishDisplayName(name) || latitude === undefined || longitude === undefined || seen.has(name)) return [];
    seen.add(name);
    const kind = element.tags?.cuisine || element.tags?.amenity || 'Food spot';
    return [{ name, latitude, longitude, kind: kind.replaceAll('_', ' ') }];
  }).slice(0, 4);
  return Promise.all(food.map(async (place) => ({ ...place, imageUrl: await fetchPlaceImage(place.name, signal) })));
}

async function fetchPlaceImage(placeName: string, signal: AbortSignal): Promise<string | undefined> {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  url.searchParams.set('prop', 'pageimages');
  url.searchParams.set('piprop', 'thumbnail');
  url.searchParams.set('pithumbsize', '560');
  url.searchParams.set('titles', placeName);

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return undefined;
    const data = await response.json() as { query?: { pages?: Record<string, { thumbnail?: { source?: string } }> } };
    return Object.values(data.query?.pages ?? {})[0]?.thumbnail?.source;
  } catch (error) {
    if (signal.aborted) throw error;
    return undefined;
  }
}

/** Small, abortable city briefing using GDELT and OpenStreetMap's Overpass API. */
export function useDestinationBriefing(destination: Destination | undefined): BriefingState {
  const [state, setState] = useState<BriefingState>(EMPTY_BRIEFING);
  useEffect(() => {
    if (!destination) return;
    const controller = new AbortController();
    setState({ ...EMPTY_BRIEFING, places: fallbackPlaces(destination) });
    Promise.allSettled([fetchNews(destination, controller.signal), fetchPlaces(destination, controller.signal), fetchFood(destination, controller.signal)]).then(([newsResult, placesResult, foodResult]) => {
      if (controller.signal.aborted) return;
      const news = newsResult.status === 'fulfilled' ? newsResult.value : [];
      const livePlaces = placesResult.status === 'fulfilled' ? placesResult.value : [];
      const food = foodResult.status === 'fulfilled' ? foodResult.value : [];
      setState({ news, places: livePlaces.length ? livePlaces : fallbackPlaces(destination), food, loading: false, hasLivePlaces: livePlaces.length > 0 });
    });
    return () => controller.abort();
  }, [destination]);
  return state;
}
