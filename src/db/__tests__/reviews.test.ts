/**
 * Integration test of the persistence loop: migrations, SM-2 scheduling and
 * due-item queries run against a real SQLite engine (see expo-sqlite-mock).
 */
import { bumpLaunchCount, getMeta, setMeta } from '../index';
import { dueItemIds, getReview, getReviewsForTrack, recordAnswer } from '../reviews';

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;

describe('db integration (real SQLite via node:sqlite)', () => {
  it('runs migrations and persists meta values', () => {
    expect(getMeta('missing')).toBeNull();
    setMeta('active_track', 'klass8');
    expect(getMeta('active_track')).toBe('klass8');
    setMeta('active_track', 'vhf');
    expect(getMeta('active_track')).toBe('vhf');
  });

  it('counts launches', () => {
    const first = bumpLaunchCount();
    expect(bumpLaunchCount()).toBe(first + 1);
  });

  it('schedules a correctly answered new item one day out', () => {
    const rec = recordAnswer('item-a', 'klass8', true, T0);
    expect(rec.repetitions).toBe(1);
    expect(rec.dueAt).toBe(T0 + 1 * DAY);

    const stored = getReview('item-a', 'klass8');
    expect(stored).not.toBeNull();
    expect(stored!.dueAt).toBe(T0 + 1 * DAY);
    expect(stored!.lastResult).toBe(true);
  });

  it('advances the schedule on the second success', () => {
    const rec = recordAnswer('item-a', 'klass8', true, T0 + 1 * DAY);
    expect(rec.repetitions).toBe(2);
    expect(rec.dueAt).toBe(T0 + 1 * DAY + 6 * DAY);
  });

  it('makes a failed item due immediately', () => {
    const rec = recordAnswer('item-b', 'klass8', false, T0);
    expect(rec.repetitions).toBe(0);
    expect(rec.dueAt).toBe(T0);
    expect(dueItemIds('klass8', T0)).toContain('item-b');
  });

  it('excludes future items from the due list and orders by due time', () => {
    recordAnswer('item-c', 'klass8', false, T0 + 1000);
    const due = dueItemIds('klass8', T0 + 1000);
    expect(due).toEqual(['item-b', 'item-c']); // item-a is a day out
    expect(due).not.toContain('item-a');
    expect(dueItemIds('klass8', T0 + 10 * DAY)).toContain('item-a');
  });

  it('keeps tracks independent', () => {
    recordAnswer('item-a', 'forarintyg', false, T0);
    const forarintyg = getReviewsForTrack('forarintyg');
    expect(forarintyg).toHaveLength(1);
    expect(forarintyg[0].repetitions).toBe(0);
    // klass8's item-a schedule is untouched
    expect(getReview('item-a', 'klass8')!.repetitions).toBe(2);
  });
});
