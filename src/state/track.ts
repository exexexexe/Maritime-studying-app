import type { Track } from '@/content/types';
import { getMeta, setMeta } from '@/db';

/**
 * Active certification track. Klass 8 is the anchor track and the default.
 * Phase 7 adds the first-run selector and settings toggle on top of this.
 */

const KEY = 'active_track';
const DEFAULT_TRACK: Track = 'klass8';

const VALID: Track[] = ['forarintyg', 'kustskeppare', 'klass8', 'vhf'];

export function getActiveTrack(): Track {
  const stored = getMeta(KEY);
  return VALID.includes(stored as Track) ? (stored as Track) : DEFAULT_TRACK;
}

export function setActiveTrack(track: Track): void {
  setMeta(KEY, track);
}
