export interface PublicPlace {
  name: string;
  kind: 'park' | 'sight' | 'food';
}

type NominatimResult = { lat: string; lon: string };
type OsmElement = { tags?: Record<string, string> };

const CACHE_KEY = 'atlas-public-place-research-v1';

function readCache(city: string): PublicPlace[] | undefined {
  try {
    const value = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, PublicPlace[]>;
    return value[city.toLowerCase()];
  } catch { return undefined; }
}

function writeCache(city: string, places: PublicPlace[]): void {
  try {
    const value = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, PublicPlace[]>;
    value[city.toLowerCase()] = places;
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch { /* A fresh search remains available without cache. */ }
}

export async function findPublicPlaces(city: string, signal: AbortSignal): Promise<PublicPlace[]> {
  const cached = readCache(city);
  if (cached?.length) return cached;
  const geocode = new URL('https://nominatim.openstreetmap.org/search');
  geocode.searchParams.set('q', city);
  geocode.searchParams.set('format', 'jsonv2');
  geocode.searchParams.set('limit', '1');
  const locationResponse = await fetch(geocode, { signal, headers: { Accept: 'application/json' } });
  const [location] = await locationResponse.json() as NominatimResult[];
  if (!location) throw new Error('City not found. Try a city and country, such as “Melbourne, Australia”.');

  const query = `[out:json][timeout:12];(nwr["leisure"="park"](around:7000,${location.lat},${location.lon});nwr["tourism"~"attraction|museum|gallery|viewpoint|zoo"](around:7000,${location.lat},${location.lon});nwr["amenity"~"restaurant|cafe|food_court"](around:7000,${location.lat},${location.lon}););out center 45;`;
  const overpass = new URL('https://overpass-api.de/api/interpreter');
  overpass.searchParams.set('data', query);
  const response = await fetch(overpass, { signal });
  const data = await response.json() as { elements?: OsmElement[] };
  const seen = new Set<string>();
  const places = (data.elements ?? []).flatMap((element) => {
    const name = element.tags?.name?.trim();
    if (!name || seen.has(name)) return [];
    seen.add(name);
    const kind: PublicPlace['kind'] = element.tags?.leisure === 'park' ? 'park' : element.tags?.amenity ? 'food' : 'sight';
    return [{ name, kind }];
  });
  const selected = ['park', 'sight', 'food'].flatMap((kind) => places.filter((place) => place.kind === kind).slice(0, 6));
  if (!selected.length) throw new Error('No public place data was returned for this city. Try again shortly.');
  writeCache(city, selected);
  return selected;
}
