import type { Item, LanternScene } from '@/content/types';

import { seededShuffle } from './shuffle';

/**
 * Timed identification sprint — a drill *mode*, not a new content type
 * (see UI rework Phase 6). Reuses the existing lantern items authored with
 * an animated payload.scene.lights[].characteristic (currently the 20
 * items in "Ljuskaraktärer — identifiera") rather than requiring new
 * authoring; any future item authored the same way is automatically
 * sprint-eligible.
 */

export function characteristicOf(item: Item): string | null {
  if (item.type !== 'lantern') return null;
  const scene = (item.payload as { scene?: LanternScene } | undefined)?.scene;
  return scene?.lights.find((l) => l.characteristic)?.characteristic ?? null;
}

export function lanternSprintItems(items: Item[]): Item[] {
  return items.filter((i) => characteristicOf(i) !== null);
}

export interface SprintChoice {
  text: string;
  isCorrect: boolean;
}

const CHOICE_COUNT = 4;

/**
 * Four short notation choices — the correct characteristic plus distractors
 * drawn from other items' characteristics in the same pool, not parsed out
 * of the (much longer) mcq option sentences those items also carry. Stable
 * for one item within one attempt, varies between attempts — same pattern
 * as attemptSeed-driven option shuffling elsewhere.
 */
export function sprintChoices(item: Item, pool: Item[], seed: number): SprintChoice[] {
  const correct = characteristicOf(item);
  if (!correct) return [];
  const otherChars = [...new Set(pool.map(characteristicOf).filter((c): c is string => c !== null && c !== correct))];
  const distractors = seededShuffle(otherChars, seed).slice(0, CHOICE_COUNT - 1);
  const choices: SprintChoice[] = [
    { text: correct, isCorrect: true },
    ...distractors.map((text) => ({ text, isCorrect: false })),
  ];
  return seededShuffle(choices, seed ^ 0x9e3779b9);
}
