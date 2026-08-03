import type { Track } from '@/content/types';
import { gradeAnswer, NEW_ITEM_STATE, nextDueAt, sm2, type Sm2State } from '@/srs/sm2';

import { getStorage } from './index';
import type { ReviewRecord } from './storage';

export type { ReviewRecord } from './storage';

export function getReview(itemId: string, track: Track): ReviewRecord | null {
  return getStorage().getReview(itemId, track);
}

export function getReviewsForTrack(track: Track): ReviewRecord[] {
  return getStorage().getReviewsForTrack(track);
}

/** Item ids with review state due at or before `now`, oldest due first. */
export function dueItemIds(track: Track, now: number): string[] {
  return getStorage().dueItemIds(track, now);
}

/**
 * Record an answer: runs SM-2 on the item's current state and persists the
 * new schedule. Returns the updated record.
 */
export function recordAnswer(
  itemId: string,
  track: Track,
  correct: boolean,
  now: number,
): ReviewRecord {
  const prior: Sm2State = getReview(itemId, track) ?? NEW_ITEM_STATE;
  const next = sm2(prior, gradeAnswer(correct));
  const record: ReviewRecord = {
    itemId,
    track,
    ...next,
    dueAt: nextDueAt(next, now),
    lastResult: correct,
    updatedAt: now,
  };
  getStorage().upsertReview(record);
  return record;
}
