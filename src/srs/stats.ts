import { itemsForModule, modules } from '@/content';
import type { Track } from '@/content/types';
import { dueItemIds, getReviewsForTrack } from '@/db/reviews';

/** Aggregates that drive the dashboard. */

export interface ModuleCoverage {
  moduleId: string;
  titleSv: string;
  slug: string;
  itemCount: number;
  due: number;
  /** True when seed volume is thin and authoring attention is needed. */
  thin: boolean;
}

export interface WeakModule {
  moduleId: string;
  titleSv: string;
  slug: string;
  wrong: number;
  reviewed: number;
}

export interface DashboardStats {
  dueTotal: number;
  /** Module with the most due items — the natural next session. */
  nextModule: { titleSv: string; slug: string; due: number } | null;
  reviewedTotal: number;
  weakModules: WeakModule[];
  coverage: ModuleCoverage[];
}

const THIN_THRESHOLD = 8;

export function dashboardStats(track: Track, now: number): DashboardStats {
  const reviews = getReviewsForTrack(track);
  const due = new Set(dueItemIds(track, now));
  const lastResultByItem = new Map(reviews.map((r) => [r.itemId, r.lastResult]));

  const coverage: ModuleCoverage[] = [];
  const weak: WeakModule[] = [];

  for (const m of modules) {
    const items = itemsForModule(m.id, track);
    if (items.length === 0) continue;

    let dueCount = 0;
    let wrong = 0;
    let reviewed = 0;
    for (const item of items) {
      if (due.has(item.id)) dueCount++;
      const last = lastResultByItem.get(item.id);
      if (last !== undefined && last !== null) {
        reviewed++;
        if (!last) wrong++;
      }
    }

    coverage.push({
      moduleId: m.id,
      titleSv: m.titleSv,
      slug: m.slug,
      itemCount: items.length,
      due: dueCount,
      thin: items.length < THIN_THRESHOLD,
    });
    if (reviewed >= 3 && wrong > 0) {
      weak.push({ moduleId: m.id, titleSv: m.titleSv, slug: m.slug, wrong, reviewed });
    }
  }

  const withDue = coverage.filter((c) => c.due > 0).sort((a, b) => b.due - a.due);

  return {
    dueTotal: coverage.reduce((sum, c) => sum + c.due, 0),
    nextModule: withDue[0]
      ? { titleSv: withDue[0].titleSv, slug: withDue[0].slug, due: withDue[0].due }
      : null,
    reviewedTotal: reviews.length,
    weakModules: weak
      .sort((a, b) => b.wrong / b.reviewed - a.wrong / a.reviewed)
      .slice(0, 3),
    coverage,
  };
}
