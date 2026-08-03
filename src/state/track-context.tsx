import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Track } from '@/content/types';
import { getMeta } from '@/db';

import { setActiveTrack } from './track';

export const TRACK_NAMES: Record<Track, string> = {
  klass8: 'Fartygsbefäl klass 8',
  forarintyg: 'Förarintyg',
  kustskeppare: 'Kustskepparintyg',
  vhf: 'VHF / SRC',
};

/** Onboarding order — the anchor track first. */
export const TRACK_ORDER: Track[] = ['klass8', 'forarintyg', 'kustskeppare', 'vhf'];

interface TrackContextValue {
  /** Active track, or null before the first-run selection. */
  track: Track | null;
  setTrack: (track: Track) => void;
}

const TrackContext = createContext<TrackContextValue | null>(null);

export function TrackProvider({ children }: { children: ReactNode }) {
  const [track, setTrackState] = useState<Track | null>(
    () => getMeta('active_track') as Track | null,
  );

  const value = useMemo(
    () => ({
      track,
      setTrack: (t: Track) => {
        setActiveTrack(t);
        setTrackState(t);
      },
    }),
    [track],
  );

  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}

/** Active track for screens past onboarding (falls back to the default). */
export function useTrack(): { track: Track; setTrack: (t: Track) => void } {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error('useTrack must be used inside TrackProvider');
  return { track: ctx.track ?? 'klass8', setTrack: ctx.setTrack };
}

/** Null until the user has picked a track on first run. */
export function useTrackOrNull(): TrackContextValue {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error('useTrackOrNull must be used inside TrackProvider');
  return ctx;
}
