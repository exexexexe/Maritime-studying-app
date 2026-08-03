import type { Track } from '@/content/types';
import type { Sm2State } from '@/srs/sm2';

/**
 * Storage backend interface for the data-access layer.
 *
 * Two implementations:
 *  - sqlite-storage: expo-sqlite, the real backend on iOS/Android
 *    (and in Jest, where expo-sqlite is mocked onto node:sqlite)
 *  - web-storage: in-memory + localStorage, ONLY for web dev preview —
 *    expo-sqlite's sync API cannot block the browser main thread
 *
 * Domain logic (SM-2 scheduling, session building) lives above this
 * interface and is identical on every platform.
 */

export interface ReviewRecord extends Sm2State {
  itemId: string;
  track: Track;
  dueAt: number;
  lastResult: boolean | null;
  updatedAt: number;
}

export interface Storage {
  getMeta(key: string): string | null;
  setMeta(key: string, value: string): void;

  getReview(itemId: string, track: Track): ReviewRecord | null;
  getReviewsForTrack(track: Track): ReviewRecord[];
  /** Item ids with due_at <= now, oldest due first. */
  dueItemIds(track: Track, now: number): string[];
  upsertReview(record: ReviewRecord): void;
}
