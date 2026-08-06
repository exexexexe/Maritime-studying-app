import { itemsForModule, itemsForTopic } from '@/content';
import type { Item, Track } from '@/content/types';
import { dueItemIds } from '@/db/reviews';
import { seededShuffle } from '@/lib/shuffle';

export const SESSION_SIZE = 12;

/**
 * Build a drill session from an item pool: items due for review first
 * (oldest due leading), then unseen items, capped at SESSION_SIZE.
 */
function sessionFromPool(pool: Item[], track: Track, now: number): Item[] {
  const poolById = new Map(pool.map((i) => [i.id, i]));

  const due = dueItemIds(track, now)
    .map((id) => poolById.get(id))
    .filter((i): i is Item => i !== undefined);

  const dueIds = new Set(due.map((i) => i.id));
  const scheduledIds = new Set(dueItemIds(track, Number.MAX_SAFE_INTEGER));
  const unseen = pool.filter((i) => !dueIds.has(i.id) && !scheduledIds.has(i.id));

  return [...due, ...unseen].slice(0, SESSION_SIZE);
}

export function buildSession(moduleId: string, track: Track, now: number): Item[] {
  return sessionFromPool(itemsForModule(moduleId, track), track, now);
}

export function buildTopicSession(topicId: string, track: Track, now: number): Item[] {
  return sessionFromPool(itemsForTopic(topicId, track), track, now);
}

/**
 * "Practice anyway" — the SM-2 schedule is a study aid, not an access
 * control. A module/topic with nothing due shouldn't be unreachable, so
 * this ignores dueAt entirely and draws straight from the full pool
 * (shuffled per call so it's not always the same first N items). Recording
 * an answer from a free session still goes through the normal SM-2 update
 * (src/db/reviews.ts), so it's a real review, just not one the schedule
 * asked for.
 */
function freeSessionFromPool(pool: Item[], now: number): Item[] {
  return seededShuffle(pool, now).slice(0, SESSION_SIZE);
}

export function buildFreeSession(moduleId: string, track: Track, now: number): Item[] {
  return freeSessionFromPool(itemsForModule(moduleId, track), now);
}

export function buildFreeTopicSession(topicId: string, track: Track, now: number): Item[] {
  return freeSessionFromPool(itemsForTopic(topicId, track), now);
}

export interface ModuleProgress {
  total: number;
  due: number;
  unseen: number;
}

function progressFromPool(pool: Item[], track: Track, now: number): ModuleProgress {
  const poolIds = new Set(pool.map((i) => i.id));
  const due = dueItemIds(track, now).filter((id) => poolIds.has(id)).length;
  const scheduled = dueItemIds(track, Number.MAX_SAFE_INTEGER).filter((id) =>
    poolIds.has(id),
  ).length;
  return { total: pool.length, due, unseen: pool.length - scheduled };
}

export function moduleProgress(moduleId: string, track: Track, now: number): ModuleProgress {
  return progressFromPool(itemsForModule(moduleId, track), track, now);
}

export function topicProgress(topicId: string, track: Track, now: number): ModuleProgress {
  return progressFromPool(itemsForTopic(topicId, track), track, now);
}
