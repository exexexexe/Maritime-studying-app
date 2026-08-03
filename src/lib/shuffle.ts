/**
 * Deterministic shuffling for answer options.
 *
 * Options are shuffled per attempt: the seed combines the item id with an
 * attempt seed (e.g. session start time), so order is stable while one
 * question is on screen but varies between attempts. Uniformity is
 * unit-tested in __tests__/shuffle.test.ts.
 */

/** mulberry32 — small, fast, good-enough PRNG for UI shuffling. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash → 32-bit seed. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Fisher–Yates with a seeded PRNG. Returns a new array. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Seed for one item within one attempt. */
export function attemptSeed(itemId: string, attemptKey: number): number {
  return (hashString(itemId) ^ (attemptKey >>> 0)) >>> 0;
}
