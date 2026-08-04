/**
 * Semantic app-state → light-characteristic mapping (DESIGN-RHYTHM.md's
 * proposed table, as actually implemented). A starting point, not gospel —
 * revise a row here if it doesn't read right once built, rather than
 * forcing it. Kept dependency-free (no Reanimated import) so it's testable
 * as plain data — see src/lib/rhythm.ts for the hook that plays it back.
 */
export const RHYTHM = {
  /** Correct answer — even, settled, confidence without drama. */
  correct: 'Iso 1.2s',
  /** Wrong answer / needs-review flag — present, brief interruption. */
  needsReview: 'Oc 2s',
  /** Exam time critical / review backlog — genuine urgency, continuous. */
  urgent: 'Q',
  /** Streak / steady progress — a single confident pulse. */
  streak: 'Fl 3s',
  /** Loading / processing — distinctive, calm, designed to be watched. */
  loading: 'Fl(2) 3.5s',
} as const;
