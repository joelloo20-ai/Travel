import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import type { Trip } from '../types/trips';

interface ItineraryAssistantModalProps {
  trip: Trip;
  onDismiss: () => void;
  onConfirm: () => Promise<void>;
}

export function ItineraryAssistantModal({ trip, onDismiss, onConfirm }: ItineraryAssistantModalProps) {
  const [working, setWorking] = useState(false);
  const generate = async () => {
    setWorking(true);
    try { await onConfirm(); onDismiss(); } finally { setWorking(false); }
  };

  return <div className="trip-confirmation" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && !working && onDismiss()}><section className="assistant-confirmation" role="dialog" aria-modal="true" aria-label="Build itinerary with AI"><button type="button" className="icon-button" onClick={onDismiss} disabled={working} aria-label="Close AI assistant"><X size={18} /></button><div className="assistant-confirmation__icon"><Sparkles size={20} /></div><span>AI itinerary assistant</span><h2>Build {trip.title} for the two of you?</h2><p>It will replace the activities in this journey with a researched, geographically sensible plan. Your flight and hotel records stay exactly as they are.</p><ul><li>Food, culture, date-night and local highlights</li><li>Times, durations, walking or transport legs and distances</li><li>Every suggestion remains editable after it is created</li></ul><div><button type="button" className="trip-secondary-button" onClick={onDismiss} disabled={working}>Keep current plan</button><button type="button" className="trip-primary-button" onClick={() => void generate()} disabled={working}>{working ? 'Building itinerary…' : 'Build my itinerary'}</button></div></section></div>;
}
