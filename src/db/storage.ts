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

export interface ExamSessionRecord {
  id: string;
  track: Track;
  mode: 'quick' | 'full';
  startedAt: number;
  finishedAt: number | null;
  itemsAttempted: number;
  correct: number;
  scorePct: number | null;
  passed: boolean | null;
  /** JSON: per-module tally for weak-area history. */
  moduleResults: string | null;
}

export type FeedbackCategory = 'wrong_answer' | 'confusing' | 'typo_translation' | 'other';

/** A tester-flagged problem — see src/db/feedback.ts. Item fields are null
 * for general feedback not tied to a specific content item. */
export interface FeedbackFlagRecord {
  id: string;
  createdAt: number;
  category: FeedbackCategory;
  note: string | null;
  itemId: string | null;
  topicId: string | null;
  itemType: string | null;
}

export interface Storage {
  getMeta(key: string): string | null;
  setMeta(key: string, value: string): void;

  getReview(itemId: string, track: Track): ReviewRecord | null;
  getReviewsForTrack(track: Track): ReviewRecord[];
  /** Item ids with due_at <= now, oldest due first. */
  dueItemIds(track: Track, now: number): string[];
  upsertReview(record: ReviewRecord): void;

  upsertExamSession(record: ExamSessionRecord): void;
  /** Sessions for a track, newest started first. */
  listExamSessions(track: Track): ExamSessionRecord[];

  insertFeedbackFlag(record: FeedbackFlagRecord): void;
  /** All flags, newest first. */
  listFeedbackFlags(): FeedbackFlagRecord[];
  countFeedbackFlags(): number;
  /** Deletes all flags — used after a tester has exported and sent them. */
  clearFeedbackFlags(): void;
}
