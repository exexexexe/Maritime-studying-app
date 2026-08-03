/**
 * SM-2 spaced-repetition scheduling (SuperMemo 2, Wozniak 1990).
 * Pure function — persistence lives in src/db, UI decides the quality grade.
 *
 * Quality scale 0–5. This app maps answers to grades in one place
 * (`gradeAnswer`): incorrect → 1, correct → 4. Finer self-grading can be
 * added later without touching the algorithm.
 */

export interface Sm2State {
  /** Ease factor, ≥ 1.3. New items start at 2.5. */
  easeFactor: number;
  /** Current inter-repetition interval in days (0 for new items). */
  intervalDays: number;
  /** Consecutive successful repetitions (quality ≥ 3). */
  repetitions: number;
}

export const NEW_ITEM_STATE: Sm2State = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
};

export const MIN_EASE = 1.3;

export function gradeAnswer(correct: boolean): number {
  return correct ? 4 : 1;
}

export function sm2(state: Sm2State, quality: number): Sm2State {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new Error(`SM-2 quality must be an integer 0–5, got ${quality}`);
  }

  // Ease factor updates on every review, including failures.
  const easeFactor = Math.max(
    MIN_EASE,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  if (quality < 3) {
    // Failed recall: restart the repetition sequence, due again immediately.
    return { easeFactor, intervalDays: 0, repetitions: 0 };
  }

  const repetitions = state.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 6;
  else intervalDays = Math.round(state.intervalDays * easeFactor);

  return { easeFactor, intervalDays, repetitions };
}

/** Next due timestamp (ms). Failed items (interval 0) are due immediately. */
export function nextDueAt(state: Sm2State, now: number): number {
  return now + state.intervalDays * 24 * 60 * 60 * 1000;
}
