import { gradeAnswer, MIN_EASE, NEW_ITEM_STATE, nextDueAt, sm2 } from '../sm2';

const DAY = 24 * 60 * 60 * 1000;

describe('sm2', () => {
  it('schedules a new item at 1 day after the first successful review', () => {
    const next = sm2(NEW_ITEM_STATE, 4);
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
  });

  it('schedules 6 days after the second consecutive success', () => {
    const first = sm2(NEW_ITEM_STATE, 4);
    const second = sm2(first, 4);
    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(6);
  });

  it('grows the interval by the ease factor from the third success on', () => {
    let s = sm2(sm2(NEW_ITEM_STATE, 4), 4);
    const ease = s.easeFactor;
    s = sm2(s, 4);
    expect(s.repetitions).toBe(3);
    expect(s.intervalDays).toBe(Math.round(6 * ease));
  });

  it('resets repetitions and interval on failure, keeping the item due now', () => {
    const mature = sm2(sm2(sm2(NEW_ITEM_STATE, 4), 4), 4);
    const failed = sm2(mature, 1);
    expect(failed.repetitions).toBe(0);
    expect(failed.intervalDays).toBe(0);
    expect(nextDueAt(failed, 1000)).toBe(1000);
  });

  it('lowers ease on failure but never below the 1.3 floor', () => {
    const failed = sm2(NEW_ITEM_STATE, 1);
    expect(failed.easeFactor).toBeLessThan(NEW_ITEM_STATE.easeFactor);

    let s = { ...NEW_ITEM_STATE };
    for (let i = 0; i < 50; i++) s = sm2(s, 0);
    expect(s.easeFactor).toBe(MIN_EASE);
  });

  it('keeps ease unchanged at quality 4 and raises it at quality 5', () => {
    expect(sm2(NEW_ITEM_STATE, 4).easeFactor).toBeCloseTo(2.5);
    expect(sm2(NEW_ITEM_STATE, 5).easeFactor).toBeCloseTo(2.6);
  });

  it('produces a strictly growing schedule under repeated success', () => {
    let s = { ...NEW_ITEM_STATE };
    let prev = 0;
    for (let i = 0; i < 8; i++) {
      s = sm2(s, 4);
      expect(s.intervalDays).toBeGreaterThan(prev);
      prev = s.intervalDays;
    }
    expect(prev).toBeGreaterThan(100); // months out after 8 perfect reviews
  });

  it('computes due timestamps from the interval', () => {
    const s = sm2(sm2(NEW_ITEM_STATE, 4), 4);
    expect(nextDueAt(s, 0)).toBe(6 * DAY);
  });

  it('rejects out-of-range quality grades', () => {
    expect(() => sm2(NEW_ITEM_STATE, 6)).toThrow();
    expect(() => sm2(NEW_ITEM_STATE, -1)).toThrow();
    expect(() => sm2(NEW_ITEM_STATE, 2.5)).toThrow();
  });

  it('maps answers to grades: correct passes, incorrect fails', () => {
    expect(gradeAnswer(true)).toBeGreaterThanOrEqual(3);
    expect(gradeAnswer(false)).toBeLessThan(3);
  });
});
