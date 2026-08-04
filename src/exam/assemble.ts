import { itemsForTrack, topics } from '@/content';
import type { Item, ItemType, Track } from '@/content/types';
import { seededShuffle } from '@/lib/shuffle';

/**
 * Exam assembly: builds a question set with a realistic mix of item types
 * per content/exams.json — image and diagram questions are a required part
 * of the mix, not an MCQ afterthought.
 */

export type ExamMode = 'quick' | 'full';

export interface ExamModeConfig {
  questions: number;
  minutes: number;
  passPct: number;
}

export interface ExamConfig {
  full: ExamModeConfig;
  quick: ExamModeConfig;
  mix: Record<Category, number>;
}

export type Category = 'theory' | 'diagram' | 'calculation' | 'image';

const CATEGORY_OF: Record<ItemType, Category> = {
  mcq: 'theory',
  scenario: 'theory',
  lantern: 'diagram',
  buoy: 'diagram',
  stability_diagram: 'diagram',
  calculation: 'calculation',
  chart_question: 'image',
  radar_question: 'image',
  map_question: 'image',
  // Never actually reached — term_card is filtered out of the exam pool
  // below (a self-graded flashcard, not something the real exam gives).
  // Still needs an entry for Record<ItemType, Category> completeness.
  term_card: 'theory',
};

const CATEGORIES: Category[] = ['theory', 'diagram', 'calculation', 'image'];

const examsJson = require('../../content/exams.json') as Record<string, unknown>;

export function examConfig(track: Track): ExamConfig {
  return examsJson[track] as ExamConfig;
}

export function categoryOf(item: Item): Category {
  return CATEGORY_OF[item.type];
}

/**
 * Pick `target` items for the track with the configured category mix.
 * Deterministic for a given seed. Clamps to the pool size and backfills
 * from other categories when one runs short.
 */
export function assembleExam(track: Track, mode: ExamMode, seed: number): Item[] {
  const config = examConfig(track);
  // term_card is a self-graded flashcard, not something the real exam
  // gives — drill-only.
  const pool = itemsForTrack(track).filter((i) => i.type !== 'term_card');
  const target = Math.min(config[mode].questions, pool.length);

  const byCategory = new Map<Category, Item[]>(
    CATEGORIES.map((c) => [c, seededShuffle(pool.filter((i) => categoryOf(i) === c), seed)]),
  );

  // First pass: proportional quotas, rounded down.
  const chosen: Item[] = [];
  for (const c of CATEGORIES) {
    const quota = Math.floor(target * (config.mix[c] ?? 0));
    chosen.push(...byCategory.get(c)!.splice(0, quota));
  }

  // Backfill to target from whatever remains, largest pools first, so a
  // thin category (e.g. image with placeholder-only content) never blocks
  // assembly.
  const remainder = seededShuffle(
    CATEGORIES.flatMap((c) => byCategory.get(c)!),
    seed ^ 0x9e3779b9,
  );
  chosen.push(...remainder.slice(0, target - chosen.length));

  return seededShuffle(chosen, seed ^ 0x517cc1b7);
}

/** Per-module tally for weak-area feedback. */
export interface ModuleResult {
  moduleId: string;
  correct: number;
  total: number;
}

export function tallyByModule(
  answers: { item: Item; correct: boolean }[],
): ModuleResult[] {
  const moduleOfTopic = new Map(topics.map((t) => [t.id, t.moduleId]));
  const tally = new Map<string, ModuleResult>();
  for (const a of answers) {
    const moduleId = moduleOfTopic.get(a.item.topicId);
    if (!moduleId) continue;
    const entry = tally.get(moduleId) ?? { moduleId, correct: 0, total: 0 };
    entry.total++;
    if (a.correct) entry.correct++;
    tally.set(moduleId, entry);
  }
  return [...tally.values()].sort(
    (a, b) => a.correct / a.total - b.correct / b.total,
  );
}
