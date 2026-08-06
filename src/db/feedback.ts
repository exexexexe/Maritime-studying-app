import { getStorage } from './index';
import type { FeedbackCategory, FeedbackFlagRecord } from './storage';

export type { FeedbackCategory, FeedbackFlagRecord } from './storage';

/**
 * Tester feedback flagging — a testing tool, not a student-facing feature.
 * Stored locally like everything else in this app (no backend); a tester
 * exports and shares the accumulated flags via the OS share sheet instead
 * of them going anywhere automatically. See src/lib/feedback-export.ts for
 * the export format and src/components/feedback-flag-button.tsx for the UI.
 */

export interface AddFeedbackFlagArgs {
  category: FeedbackCategory;
  note?: string | null;
  /** Omit all three for general feedback not tied to a content item. */
  itemId?: string | null;
  topicId?: string | null;
  itemType?: string | null;
}

export function addFeedbackFlag(args: AddFeedbackFlagArgs): FeedbackFlagRecord {
  const record: FeedbackFlagRecord = {
    id: `fb-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    createdAt: Date.now(),
    category: args.category,
    note: args.note?.trim() || null,
    itemId: args.itemId ?? null,
    topicId: args.topicId ?? null,
    itemType: args.itemType ?? null,
  };
  getStorage().insertFeedbackFlag(record);
  return record;
}

export function listFeedbackFlags(): FeedbackFlagRecord[] {
  return getStorage().listFeedbackFlags();
}

export function countFeedbackFlags(): number {
  return getStorage().countFeedbackFlags();
}

export function clearFeedbackFlags(): void {
  getStorage().clearFeedbackFlags();
}
