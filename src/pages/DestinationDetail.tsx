import { useMemo, useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, ExternalLink, MapPin, Newspaper, Tag, UtensilsCrossed, Video, X } from 'lucide-react';
import { destinationByKey } from '../data/destinations';
import { useDestinationBriefing } from '../hooks/useDestinationBriefing';
import { useLiveWeather } from '../hooks/useLiveWeather';
import { useLocalTime } from '../hooks/useLocalTime';
import { LandmarkScene } from '../components/landmark/LandmarkScene';
import { ConditionsHud } from '../components/landmark/ConditionsHud';
import { getTrips, upsertTrip } from '../lib/tripStore';
import { getSheetEndpoint, syncTripToSheet } from '../lib/sheetSync';
import { TripPlannerModal } from '../components/TripPlannerModal';
import { TripTimelineModal } from '../components/TripTimelineModal';
import type { Trip } from '../types/trips';

function futureTravelDates() {
  const departure = new Date();
  departure.setDate(departure.getDate() + 30);
  const returnDate = new Date(departure);
  returnDate.setDate(returnDate.getDate() + 7);
  const format = (date: Date) => date.toISOString().slice(0, 10);
  return { departure: format(departure), returnDate: format(returnDate) };
}

function singaporeAirlinesUrl(destinationCode: string) {
  const dates = futureTravelDates();
  const url = new URL('https://www.singaporeair.com/bookingExternal-flow.form');
  url.searchParams.set('searchType', 'commercial');
  url.searchParams.set('locale', 'en_UK');
  url.searchParams.set('countryCode', 'SG');
  url.searchParams.set('numAdults', '2');
  url.searchParams.set('numChildren', '0');
  url.searchParams.set('numInfant', '0');
  url.searchParams.set('cabinClassCode', 'Y');
  url.searchParams.set('tripType', 'R');
  url.searchParams.set('ondCityCode[0].origin', 'SIN');
  url.searchParams.set('ondCityCode[0].destination', destinationCode);
  url.searchParams.set('ondCityCode[0].departureDate', dates.departure);
  url.searchParams.set('ondCityCode[1].origin', destinationCode);
  url.searchParams.set('ondCityCode[1].destination', 'SIN');
  url.searchParams.set('ondCityCode[1].departureDate', dates.returnDate);
  return url.toString();
}

function scootUrl(destinationCode: string) {
  const dates = futureTravelDates();
  const url = new URL('https://booking.flyscoot.com/Book/Flight');
  url.searchParams.set('adt', '2');
  url.searchParams.set('chd', '0');
  url.searchParams.set('inf', '0');
  url.searchParams.set('culture', 'en-SG');
  url.searchParams.set('type', 'return');
  url.searchParams.set('dst1', 'SIN');
  url.searchParams.set('ast1', destinationCode);
  url.searchParams.set('dst2', destinationCode);
  url.searchParams.set('ast2', 'SIN');
  url.searchParams.set('dd', dates.departure);
  url.searchParams.set('rd', dates.returnDate);
  return url.toString();
}

function estimatedFlightDurationHours(destinationLatitude: number, destinationLongitude: number): string {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const singaporeLatitude = 1.3644;
  const singaporeLongitude = 103.9915;
  const distance = 6371 * Math.acos(
    Math.sin(toRadians(singaporeLatitude)) * Math.sin(toRadians(destinationLatitude))
    + Math.cos(toRadians(singaporeLatitude)) * Math.cos(toRadians(destinationLatitude)) * Math.cos(toRadians(destinationLongitude - singaporeLongitude)),
  );
  const totalMinutes = Math.max(70, Math.round((distance / 850 + 0.45) * 60 / 5) * 5);
  return `~${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

const uiDateFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function formatUiDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : uiDateFormatter.format(parsed);
}

function cityReelLinks(city: string, subject = 'travel itinerary') {
  const search = encodeURIComponent(`${city} ${subject}`);
  const hashtag = encodeURIComponent(`${city.replace(/[^a-z0-9]/gi, '').toLowerCase()}travel`);
  return [
    { label: 'TikTok reels', detail: `Find recent English-language tips from ${city}`, url: `https://www.tiktok.com/search?q=${search}` },
    { label: 'Instagram reels', detail: `Browse #${city.replace(/[^a-z0-9]/gi, '').toLowerCase()}travel for local ideas`, url: `https://www.instagram.com/explore/tags/${hashtag}/` },
  ];
}

function foodVideoLinks(city: string, foodName: string) {
  const query = encodeURIComponent(`${foodName} ${city} food reel`);
  const tag = `${city}${foodName}`.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return {
    tiktok: `https://www.tiktok.com/search?q=${query}`,
    instagram: `https://www.instagram.com/explore/tags/${tag}/`,
  };
}

interface LocalTikTokReel {
  creator: string;
  videoId: string;
}

const TIKTOK_REEL_BY_CITY: Record<string, LocalTikTokReel> = {
  melbourne: { creator: 'visitmelbourne', videoId: '7665876292767878421' },
};

function LocalReelDialog({ city, reel, onDismiss }: { city: string; reel: LocalTikTokReel; onDismiss: () => void }) {
  return (
    <div className="reel-dialog" role="presentation">
      <section className="reel-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="local-reels-title">
        <button type="button" className="icon-button" onClick={onDismiss} aria-label="Close local reels"><X size={18} /></button>
        <p className="reel-dialog__eyebrow">Local reels · English interface</p>
        <h2 id="local-reels-title">A closer look at {city}</h2>
        <p>Play a recent local reel here, or open the creator’s TikTok profile for the full collection.</p>
        <div className="reel-dialog__player">
          <iframe
            src={`https://www.tiktok.com/player/v1/${reel.videoId}?controls=1&description=0&music_info=0&loop=1`}
            title={`A local TikTok reel from ${city}`}
            allow="fullscreen; encrypted-media"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <a className="detail-outline-action reel-dialog__open" href={`https://www.tiktok.com/@${reel.creator}/video/${reel.videoId}`} target="_blank" rel="noreferrer">Open on TikTok <ExternalLink size={13} aria-hidden="true" /></a>
      </section>
    </div>
  );
}

export function DestinationDetail() {
  const { key } = useParams<{ key: string }>();
  const destination = key ? destinationByKey(key) : undefined;
  const { weather, loading: weatherLoading, error: weatherError } = useLiveWeather(destination?.latitude ?? 0, destination?.longitude ?? 0);
  const localTime = useLocalTime(destination?.timezone ?? 'UTC');
  const briefing = useDestinationBriefing(destination);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [viewingTrip, setViewingTrip] = useState<Trip>();
  const [pendingTrip, setPendingTrip] = useState<Trip>();
  const [saveMessage, setSaveMessage] = useState('');
  const [recordVersion, setRecordVersion] = useState(0);
  const [reelViewerOpen, setReelViewerOpen] = useState(false);

  if (!destination) return <Navigate to="/" replace />;
  const canSearchFlights = destination.airportCode.length === 3 && destination.airportCode !== 'SIN';
  const localReel = TIKTOK_REEL_BY_CITY[destination.key];
  const estimatedFlightTime = estimatedFlightDurationHours(destination.latitude, destination.longitude);
  const cityTrips = useMemo(() => {
    const city = destination.name.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matching = getTrips().filter((trip) => `${trip.destination} ${trip.title}`.toLowerCase().includes(city) && /^\d{4}-\d{2}-\d{2}$/.test(trip.startDate));
    return {
      upcoming: matching.filter((trip) => new Date(`${trip.startDate}T12:00:00`) >= today).sort((a, b) => a.startDate.localeCompare(b.startDate)),
      past: matching.filter((trip) => new Date(`${trip.startDate}T12:00:00`) < today).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    };
  }, [destination.name, recordVersion]);

  const prepareTrip = (trip: Trip) => {
    setPlannerOpen(false);
    setPendingTrip(trip);
  };

  const confirmTrip = () => {
    if (!pendingTrip) return;
    upsertTrip(pendingTrip);
    setRecordVersion((version) => version + 1);
    setPendingTrip(undefined);
    setSaveMessage('Itinerary added. Saving it to your travel record…');
    const endpoint = getSheetEndpoint();
    if (!endpoint) {
      setSaveMessage('Itinerary added locally. Sheet sync needs an endpoint.');
      return;
    }
    void syncTripToSheet(pendingTrip, endpoint)
      .then(() => setSaveMessage('Itinerary added and saved to your travel record.'))
      .catch(() => setSaveMessage('Itinerary added here; the sheet sync needs attention.'));
  };

  return (
    <div
      className="destination-detail"
      style={{
        '--destination-deep': destination.deep,
        '--destination-sky': destination.sky,
        '--destination-accent': destination.accent,
        '--destination-glow': destination.glow,
      } as CSSProperties}
    >
      <div className="destination-detail__scene"><LandmarkScene destination={destination} weather={weather} localTime={localTime} loading={weatherLoading} /></div>
      <div className="destination-detail__scrim" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />

      <Link to="/globe" className="detail-back"><ArrowLeft size={16} aria-hidden="true" />Globe</Link>
      <div className="detail-coordinates"><MapPin size={13} aria-hidden="true" />{destination.latitude.toFixed(4)}° {destination.latitude >= 0 ? 'N' : 'S'}, {destination.longitude.toFixed(4)}° {destination.longitude >= 0 ? 'E' : 'W'}</div>
      <ConditionsHud weather={weather} weatherLoading={weatherLoading} weatherError={weatherError} localTime={localTime} accent={destination.accent} />

      <div className="detail-content">
        <p className="destination-eyebrow" style={{ color: destination.accent }}>{destination.cityscapeLabel}</p>
        <h1 className="detail-headline">{destination.name}</h1>
        <p className="detail-airport">{destination.landmarkName} · {destination.airport} · {destination.airportCode}</p>
        <div className="detail-actions">
          <button type="button" className="destination-cta detail-cta" style={{ background: destination.accent }} onClick={() => setPlannerOpen(true)}>Plan a trip</button>
          {canSearchFlights && <a className="detail-outline-action" href="#travel-deals">Compare live fares</a>}
        </div>
        {saveMessage && <p className="destination-save-message" role="status">{saveMessage}</p>}

        <section className="destination-trip-record" aria-label={`${destination.name} trip record`}>
          <div><span>Our travel record</span><h2>{cityTrips.upcoming.length ? 'Upcoming trip' : 'Past trips'}</h2></div>
          <div className="destination-trip-record__list">
            {cityTrips.upcoming.slice(0, 1).map((trip) => <button type="button" className="destination-upcoming-trip" key={trip.id} onClick={() => setViewingTrip(trip)}><strong>Upcoming · {formatUiDate(trip.startDate)}</strong><span>{trip.title}</span><small>Open itinerary →</small></button>)}
            {cityTrips.past.slice(0, 3).map((trip) => <p key={trip.id}><strong>{formatUiDate(trip.startDate)}</strong><span>{trip.title}</span></p>)}
            {!cityTrips.upcoming.length && !cityTrips.past.length && <p><strong>No trips recorded yet</strong><span>Add the first chapter together from the globe.</span></p>}
          </div>
        </section>

        <div className="detail-planning-grid">
          <section className="detail-planning-card">
            <Newspaper size={18} className="detail-planning-icon" aria-hidden="true" />
            <h2>{destination.name} dispatch</h2>
            {briefing.loading ? <p>Loading the latest local coverage…</p> : briefing.news.length ? <ul className="briefing-list">{briefing.news.map((story) => <li key={story.url}><a href={story.url} target="_blank" rel="noreferrer">{story.title}<ExternalLink size={12} aria-hidden="true" /></a><span>{story.source}</span></li>)}</ul> : <p>No recent English-language stories found. Try again shortly.</p>}
          </section>
          <section className="detail-planning-card detail-planning-card--places">
            <Video size={18} className="detail-planning-icon" aria-hidden="true" />
            <h2>Local reels</h2>
            <p>Short-form local videos in English, for deciding what deserves a place in your itinerary.</p>
            {localReel ? <button type="button" className="reel-launch" onClick={() => setReelViewerOpen(true)}><Video size={14} aria-hidden="true" /> Play local reels in this page</button> : null}
            <ul className="place-feed">
              {briefing.places.map((place) => {
                const reelLinks = cityReelLinks(destination.name, `${place.name} travel reel`);
                return <li key={`${place.name}-${place.latitude}`}>
                  <a href={reelLinks[0].url} target="_blank" rel="noreferrer" className="place-feed__item" aria-label={`Open TikTok reels for ${place.name}`}>
                    <span className="place-feed__media">
                      {place.imageUrl ? <img src={place.imageUrl} alt="" loading="lazy" /> : <span className="place-feed__fallback" style={{ background: `linear-gradient(135deg, ${destination.deep}, ${destination.accent})` }} />}
                      <span className="place-feed__play"><Video size={12} aria-hidden="true" /></span>
                    </span>
                    <span className="place-feed__copy"><strong>{place.name}</strong><span>{place.kind} · TikTok reels <ExternalLink size={11} aria-hidden="true" /></span></span>
                  </a>
                </li>;
              })}
            </ul>
            <div className="reel-platform-links">
              {cityReelLinks(destination.name).map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}<ExternalLink size={12} aria-hidden="true" /></a>)}
            </div>
          </section>
          <section className="detail-planning-card detail-planning-card--food">
            <UtensilsCrossed size={18} className="detail-planning-icon" aria-hidden="true" />
            <h2>What locals eat</h2>
            <p>Fresh local food spots from public map data, with TikTok and Instagram reels for extra context.</p>
            <ul className="place-feed">
              {briefing.food.map((food) => {
                const links = foodVideoLinks(destination.name, food.name);
                return <li key={`${food.name}-${food.latitude}`}>
                  <div className="place-feed__item">
                    <span className="place-feed__media">
                      {food.imageUrl ? <img src={food.imageUrl} alt="" loading="lazy" /> : <span className="place-feed__fallback" style={{ background: `linear-gradient(135deg, ${destination.accent}, ${destination.deep})` }} />}
                      <span className="place-feed__play"><UtensilsCrossed size={12} aria-hidden="true" /></span>
                    </span>
                    <span className="place-feed__copy"><strong>{food.name}</strong><span>{food.kind}</span><span className="food-video-links"><a href={links.tiktok} target="_blank" rel="noreferrer">TikTok</a><a href={links.instagram} target="_blank" rel="noreferrer">Instagram</a></span></span>
                  </div>
                </li>;
              })}
              {!briefing.loading && !briefing.food.length && <li className="place-feed__empty">Food spots are refreshing—try again shortly.</li>}
            </ul>
          </section>
          <section className="detail-planning-card detail-planning-card--deals" id="travel-deals">
            <Tag size={18} className="detail-planning-icon" aria-hidden="true" />
            <h2>Flight deals</h2>
            {!canSearchFlights ? <p>{destination.airportCode === 'SIN' ? 'Singapore is your origin. Pick another city to open a two-adult fare search.' : 'Choose a port city from the globe to open a two-adult fare search.'}</p> : <><p>Live return search from Singapore to {destination.name} for two adults.</p><p className="flight-duration"><Clock3 size={14} /> Estimated nonstop duration: <strong>{estimatedFlightTime}</strong></p><div className="airline-links"><a href={scootUrl(destination.airportCode)} target="_blank" rel="noreferrer">Scoot <ExternalLink size={12} aria-hidden="true" /></a><a href={singaporeAirlinesUrl(destination.airportCode)} target="_blank" rel="noreferrer">Singapore Airlines <ExternalLink size={12} aria-hidden="true" /></a></div></>}
          </section>
        </div>
        <p className="briefing-attribution">City news uses <a href="https://www.gdeltproject.org/" target="_blank" rel="noreferrer">GDELT</a>; places and city foods refresh from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> public map data when you open the page. Video actions open TikTok or Instagram only.</p>
      </div>
      {plannerOpen && <TripPlannerModal destination={destination} requireFlightDetails onDismiss={() => setPlannerOpen(false)} onSaved={prepareTrip} onDraftSave={(trip) => {
        upsertTrip(trip);
        setRecordVersion((version) => version + 1);
        const endpoint = getSheetEndpoint();
        if (endpoint) void syncTripToSheet(trip, endpoint);
      }} />}
      {viewingTrip && <TripTimelineModal trip={viewingTrip} onDismiss={() => setViewingTrip(undefined)} onEdit={() => { setViewingTrip(undefined); setPlannerOpen(true); }} onUpdateEntries={(entries) => {
        const updatedTrip = { ...viewingTrip, itinerary: [...viewingTrip.itinerary.filter((entry) => !entries.some((updated) => updated.id === entry.id)), ...entries], updatedAt: new Date().toISOString() };
        upsertTrip(updatedTrip);
        setViewingTrip(updatedTrip);
        setRecordVersion((version) => version + 1);
        const endpoint = getSheetEndpoint();
        if (endpoint) void syncTripToSheet(updatedTrip, endpoint);
      }} />}
      {pendingTrip && <div className="trip-confirmation" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="trip-confirmation-title"><button type="button" className="icon-button" onClick={() => setPendingTrip(undefined)} aria-label="Close confirmation"><X size={18} /></button><span>Ready to record</span><h2 id="trip-confirmation-title">Add {pendingTrip.title}?</h2><p>This creates the itinerary for {destination.name} and sends it to your travel record.</p><div><button type="button" className="trip-secondary-button" onClick={() => setPendingTrip(undefined)}>Back</button><button type="button" className="trip-primary-button" onClick={confirmTrip}>Confirm itinerary</button></div></section></div>}
      {reelViewerOpen && localReel ? <LocalReelDialog city={destination.name} reel={localReel} onDismiss={() => setReelViewerOpen(false)} /> : null}
    </div>
  );
}
