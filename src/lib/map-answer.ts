import type { Item, MapAnswer } from '@/content/types';

/**
 * Grading and input-state helpers for map_question's numeric_tolerance
 * answer mode. Free-text numeric entry, so this owns parsing (comma or dot
 * decimal separator) and tolerance checks — including bearing's circular
 * wraparound (359° vs 2° is 3° apart, not 357°).
 */

export type MapAnswerValue =
  | { kind: 'bearing' | 'distance' | 'depth'; text: string }
  | { kind: 'position'; latText: string; lonText: string };

export function emptyMapAnswerValue(answer: MapAnswer): MapAnswerValue {
  return answer.kind === 'position'
    ? { kind: 'position', latText: '', lonText: '' }
    : { kind: answer.kind, text: '' };
}

/** Empty input state for an item, or null when it isn't a numeric_tolerance
 * map_question — shared by the drill and exam-run screens. */
export function initialMapAnswerValue(item: Item | undefined): MapAnswerValue | null {
  if (item?.type === 'map_question' && item.answerMode === 'numeric_tolerance' && item.answer) {
    return emptyMapAnswerValue(item.answer);
  }
  return null;
}

function parseNum(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function isMapAnswerComplete(value: MapAnswerValue): boolean {
  if (value.kind === 'position') {
    return parseNum(value.latText) !== null && parseNum(value.lonText) !== null;
  }
  return parseNum(value.text) !== null;
}

/** Great-circle distance in meters (haversine). */
function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Shortest angular distance between two bearings, 0–180°. */
function bearingDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function gradeMapAnswer(answer: MapAnswer, value: MapAnswerValue): boolean {
  if (answer.kind === 'position') {
    if (value.kind !== 'position') return false;
    const lat = parseNum(value.latText);
    const lon = parseNum(value.lonText);
    if (lat === null || lon === null) return false;
    return haversineMeters(answer.expected, { lat, lon }) <= answer.tolerance;
  }
  if (value.kind === 'position') return false;
  const given = parseNum(value.text);
  if (given === null) return false;
  const diff = answer.kind === 'bearing' ? bearingDiff(given, answer.expected) : Math.abs(given - answer.expected);
  return diff <= answer.tolerance;
}

const UNIT_SUFFIX: Record<Exclude<MapAnswer['kind'], 'position'>, string> = {
  bearing: '°',
  distance: ' M',
  depth: ' m',
};

export function formatMapAnswerGiven(value: MapAnswerValue): string {
  if (value.kind === 'position') return `${value.latText || '—'}, ${value.lonText || '—'}`;
  return `${value.text}${UNIT_SUFFIX[value.kind]}`;
}

export function formatMapAnswerExpected(answer: MapAnswer): string {
  if (answer.kind === 'position') {
    return `${answer.expected.lat.toFixed(4)}, ${answer.expected.lon.toFixed(4)}`;
  }
  return `${answer.expected}${UNIT_SUFFIX[answer.kind]}`;
}
