import type { Item } from '@/content/types';

/**
 * Grading for radio_procedure items (see content/AUTHORING.md): correct
 * only on an exact sequence match against requiredBlocks, with no
 * distractor blocks included. The grade is binary, but feedbackSv tells
 * the student *what* was wrong — an irrelevant inclusion vs. missing
 * required parts vs. the right parts in the wrong order — rather than
 * just pass/fail.
 */
export interface RadioProcedureResult {
  correct: boolean;
  feedbackSv: string;
}

export function gradeRadioProcedure(item: Item, placedIds: string[]): RadioProcedureResult {
  const required = item.requiredBlocks ?? [];
  const requiredIds = required.map((b) => b.id);
  const requiredTexts = required.map((b) => b.text);
  const requiredIdSet = new Set(requiredIds);
  const distractorIdSet = new Set((item.distractorBlocks ?? []).map((b) => b.id));
  const textById = new Map<string, string>([
    ...required.map((b): [string, string] => [b.id, b.text]),
    ...(item.distractorBlocks ?? []).map((b): [string, string] => [b.id, b.text]),
  ]);

  const includedDistractor = placedIds.some((id) => distractorIdSet.has(id));
  const placedRequiredCount = placedIds.filter((id) => requiredIdSet.has(id)).length;
  const missingCount = requiredIds.length - placedRequiredCount;
  const rightSetRightCount =
    !includedDistractor && missingCount === 0 && placedIds.length === requiredIds.length;
  // Compare by text, not id — a call with the same phrase repeated (MAYDAY
  // ×3, a vessel name ×2) has interchangeable blocks the student has no
  // way to tell apart. Grading must not silently require one arbitrary,
  // invisible id tie-break among identical-looking chips.
  const inOrder =
    rightSetRightCount && placedIds.every((id, i) => textById.get(id) === requiredTexts[i]);

  if (inOrder) {
    return { correct: true, feedbackSv: 'Meddelandet är korrekt uppbyggt, i rätt ordning.' };
  }

  const parts: string[] = [];
  if (includedDistractor) parts.push('innehöll fraser som inte hör hemma i anropet');
  if (missingCount > 0) parts.push('saknade obligatoriska delar');
  if (rightSetRightCount) parts.push('hade rätt delar men i fel ordning');
  if (parts.length === 0) parts.push('stämde inte med rätt anrop');

  return { correct: false, feedbackSv: `Ditt anrop ${parts.join(' och ')}.` };
}
