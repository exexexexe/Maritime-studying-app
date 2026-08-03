import { attemptSeed, hashString, seededShuffle } from '../shuffle';

describe('seededShuffle', () => {
  const options = [
    { text: 'correct', isCorrect: true },
    { text: 'wrong a', isCorrect: false },
    { text: 'wrong b', isCorrect: false },
    { text: 'wrong c', isCorrect: false },
  ];

  it('is stable for the same seed (same order within one attempt)', () => {
    const seed = attemptSeed('lan-grund-001', 1234567);
    const a = seededShuffle(options, seed).map((o) => o.text);
    const b = seededShuffle(options, seed).map((o) => o.text);
    expect(a).toEqual(b);
  });

  it('varies between attempts', () => {
    const orders = new Set(
      Array.from({ length: 50 }, (_, k) =>
        seededShuffle(options, attemptSeed('lan-grund-001', k))
          .map((o) => o.text)
          .join('|'),
      ),
    );
    expect(orders.size).toBeGreaterThan(10); // 24 permutations exist; many must appear
  });

  it('does not lose or duplicate options', () => {
    const out = seededShuffle(options, 42);
    expect([...out].sort((x, y) => x.text.localeCompare(y.text))).toEqual(
      [...options].sort((x, y) => x.text.localeCompare(y.text)),
    );
  });

  it('places the correct answer roughly uniformly over 1000 attempts', () => {
    const positions = [0, 0, 0, 0];
    for (let attempt = 0; attempt < 1000; attempt++) {
      const shuffled = seededShuffle(options, attemptSeed('item-x', attempt));
      positions[shuffled.findIndex((o) => o.isCorrect)]++;
    }
    // Expected 250 per position; allow a generous band that still catches
    // index-0 bias or a broken PRNG.
    for (const count of positions) {
      expect(count).toBeGreaterThan(180);
      expect(count).toBeLessThan(320);
    }
  });

  it('hashes distinct ids to distinct seeds (spot check)', () => {
    expect(hashString('lan-grund-001')).not.toBe(hashString('lan-grund-002'));
  });
});
