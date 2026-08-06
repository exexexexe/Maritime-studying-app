import type { LanternScene, LightSector } from '@/content/types';

/**
 * Sector math for the orbit trainer (src/app/orbit/lantern.tsx) — given a
 * relative bearing (0° = dead ahead, clockwise from there, matching every
 * other bearing convention already used in the app), which of a vessel's
 * lights are visible.
 *
 * A sector is authored as [startDeg, endDeg) and is always read as "sweep
 * forward (clockwise) from start to end" — this means a sector can be
 * authored either way round the 0°/360° seam (a sternlight as 112.5 →
 * 247.5, a masthead light as -112.5 → 112.5) and both work identically
 * without special-casing which one "wraps": shifting the query angle by
 * -startDeg and comparing against the shifted, normalized span handles
 * every case uniformly.
 */

export function normalizeDeg(deg: number): number {
  'worklet';
  return ((deg % 360) + 360) % 360;
}

export function isAngleInSector(angleDeg: number, sector: LightSector): boolean {
  'worklet';
  const rawSpan = sector.endDeg - sector.startDeg;
  // A full circle (an all-round light, e.g. 0–360) normalizes its span to
  // 0 under modulo — 360° ≡ 0° — which would wrongly collapse it to a
  // single point instead of "always visible". Catch it before normalizing.
  if (rawSpan >= 360) return true;
  const shifted = normalizeDeg(angleDeg - sector.startDeg);
  const span = normalizeDeg(rawSpan);
  return shifted <= span;
}

/** The subset of `scene.lights` currently visible at `angleDeg`. Lights
 * without a matching `lightSectors` entry (or without an `id` at all) are
 * never shown — every light meant for the orbit trainer needs both. */
export function visibleLights(scene: LanternScene, angleDeg: number): LanternScene['lights'] {
  const sectors = scene.lightSectors ?? [];
  const visibleIds = new Set(
    sectors.filter((s) => isAngleInSector(angleDeg, s)).map((s) => s.lightId),
  );
  return scene.lights.filter((l) => l.id && visibleIds.has(l.id));
}
