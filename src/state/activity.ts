import { getMeta, setMeta } from '@/db';

/**
 * Simple study streak: consecutive calendar days with at least one answered
 * question (drill or exam). Deliberately not gamified beyond this.
 */

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function previousDayKey(ts: number): string {
  return dayKey(ts - 24 * 60 * 60 * 1000);
}

export function markActivity(now: number): void {
  const today = dayKey(now);
  const last = getMeta('last_active_day');
  if (last === today) return;
  const streak = last === previousDayKey(now) ? Number(getMeta('streak') ?? '0') + 1 : 1;
  setMeta('last_active_day', today);
  setMeta('streak', String(streak));
}

/** Current streak in days; 0 if the streak is broken (no activity today or yesterday). */
export function getStreak(now: number): number {
  const last = getMeta('last_active_day');
  if (last === dayKey(now) || last === previousDayKey(now)) {
    return Number(getMeta('streak') ?? '0');
  }
  return 0;
}
