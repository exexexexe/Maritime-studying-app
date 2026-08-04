import { parseCharacteristic } from '../characteristics';

function sumMs(segments: { ms: number }[]) {
  return segments.reduce((s, seg) => s + seg.ms, 0);
}

describe('parseCharacteristic — segment integrity', () => {
  // Every real characteristic actually used in content/buoyage/
  // fyrar-och-ljuskaraktarer.json (the 6:16 diagram exercise, 20 items).
  const REAL_CONTENT_CASES = [
    'FR',
    'Oc 5s',
    'Oc(2) 10s',
    'Iso 5s',
    'LFl 10s',
    'LFl(2) 20s',
    'Fl 3s',
    'Fl(2) 6s',
    'Fl(1+4) 15s',
    'Q',
    'Q(3)',
    'Q(9)',
    'Q(6)LFl',
    'IQ 15s',
    'VQ',
    'VQ(3)',
    'VQ(9)',
    'VQ(6)LFl',
    'Mo(K) 10s',
    'F Fl 5s',
  ];

  it.each(REAL_CONTENT_CASES.filter((c) => c !== 'FR'))('%s: segments sum exactly to the stated period', (spec) => {
    const c = parseCharacteristic(spec);
    expect(sumMs(c.segments)).toBe(c.periodMs);
  });

  it('parses "FR" (fixed + colour mnemonic) as a fixed light', () => {
    // Colour is conveyed separately via the light's own `color` field, not
    // through this parser — "FR" is just shorthand for a fixed red light.
    const c = parseCharacteristic('FR');
    expect(c.segments).toEqual([{ on: true, ms: 1 }]);
  });

  it('every segment has a positive duration', () => {
    for (const spec of REAL_CONTENT_CASES) {
      if (spec === 'FR') continue;
      const c = parseCharacteristic(spec);
      for (const seg of c.segments) expect(seg.ms).toBeGreaterThan(0);
    }
  });
});

describe('parseCharacteristic — specific shapes', () => {
  it('Fl 3s: one short flash then dark for the remainder', () => {
    const c = parseCharacteristic('Fl 3s');
    expect(c.segments).toEqual([
      { on: true, ms: 1000 },
      { on: false, ms: 2000 },
    ]);
  });

  it('LFl 10s: one long (≥2s) flash then dark', () => {
    const c = parseCharacteristic('LFl 10s');
    expect(c.segments[0]).toEqual({ on: true, ms: 2000 });
    expect(c.segments[0].ms).toBeGreaterThanOrEqual(2000);
  });

  it('Fl(2) 6s: two short flashes with a gap, then dark to fill the period', () => {
    const c = parseCharacteristic('Fl(2) 6s');
    const onSegments = c.segments.filter((s) => s.on);
    expect(onSegments).toHaveLength(2);
    expect(sumMs(c.segments)).toBe(6000);
  });

  it('Fl(1+4) 15s: a composite group with a longer gap between sub-groups', () => {
    const c = parseCharacteristic('Fl(1+4) 15s');
    const onSegments = c.segments.filter((s) => s.on);
    expect(onSegments).toHaveLength(5); // 1 + 4 flashes total
    expect(sumMs(c.segments)).toBe(15000);
  });

  it('Iso 5s: exactly equal on and off time', () => {
    const c = parseCharacteristic('Iso 5s');
    expect(c.segments).toEqual([
      { on: true, ms: 2500 },
      { on: false, ms: 2500 },
    ]);
  });

  it('Oc 5s: light dominates, with one brief eclipse', () => {
    const c = parseCharacteristic('Oc 5s');
    const onMs = c.segments.filter((s) => s.on).reduce((a, s) => a + s.ms, 0);
    const offMs = c.segments.filter((s) => !s.on).reduce((a, s) => a + s.ms, 0);
    expect(onMs).toBeGreaterThan(offMs); // occulting: light dominates
  });

  it('Oc(2) 10s: two brief eclipses within the period', () => {
    const c = parseCharacteristic('Oc(2) 10s');
    expect(c.segments.filter((s) => !s.on)).toHaveLength(2);
  });

  it('Q: continuous quick flashing at ~60/min (1s cycle)', () => {
    const c = parseCharacteristic('Q');
    expect(c.periodMs).toBe(1000);
  });

  it('VQ: continuous very-quick flashing at ~120/min (0.5s cycle), twice Q rate', () => {
    const q = parseCharacteristic('Q');
    const vq = parseCharacteristic('VQ');
    expect(vq.periodMs).toBeLessThan(q.periodMs);
    expect(q.periodMs / vq.periodMs).toBeCloseTo(2, 0);
  });

  it('Q(3): three quick flashes grouped, then eclipse — east cardinal', () => {
    const c = parseCharacteristic('Q(3)');
    expect(c.segments.filter((s) => s.on)).toHaveLength(3);
  });

  it('Q(6)LFl: six quick flashes then one long flash — south cardinal', () => {
    const c = parseCharacteristic('Q(6)LFl');
    const onSegments = c.segments.filter((s) => s.on);
    expect(onSegments).toHaveLength(7); // 6 quick + 1 long
    expect(onSegments.at(-1)!.ms).toBeGreaterThanOrEqual(2000); // the long flash
  });

  it('VQ(6)LFl uses the very-quick flash rate for its group', () => {
    const c = parseCharacteristic('VQ(6)LFl');
    const onSegments = c.segments.filter((s) => s.on);
    expect(onSegments).toHaveLength(7);
    expect(onSegments[0].ms).toBeLessThan(1000); // very-quick, not quick
  });

  it('IQ 15s: quick flashing interrupted by one long, distinct eclipse', () => {
    const c = parseCharacteristic('IQ 15s');
    const eclipse = c.segments.at(-1)!;
    expect(eclipse.on).toBe(false);
    expect(eclipse.ms).toBeGreaterThan(3000); // clearly longer than an inter-flash gap
    expect(sumMs(c.segments)).toBe(15000);
  });

  it('Mo(K) 10s: dash-dot-dash, the Morse pattern for K', () => {
    const c = parseCharacteristic('Mo(K) 10s');
    const onSegments = c.segments.filter((s) => s.on);
    expect(onSegments).toHaveLength(3);
    // dash, dot, dash — dashes are longer than the dot
    expect(onSegments[0].ms).toBeGreaterThan(onSegments[1].ms);
    expect(onSegments[2].ms).toBeGreaterThan(onSegments[1].ms);
    expect(onSegments[0].ms).toBe(onSegments[2].ms);
  });

  it('F Fl 5s: a dim baseline stays lit, with a brighter periodic flash', () => {
    const c = parseCharacteristic('F Fl 5s');
    const bright = c.segments.find((s) => s.intensity === 1);
    const dim = c.segments.find((s) => (s.intensity ?? 1) < 1);
    expect(bright).toBeDefined();
    expect(dim).toBeDefined();
    expect(c.segments.every((s) => s.on)).toBe(true); // never fully dark
  });

  it('F: continuously on, no eclipse', () => {
    const c = parseCharacteristic('F 4s');
    expect(c.segments).toEqual([{ on: true, ms: 4000 }]);
  });
});

describe('parseCharacteristic — error handling', () => {
  it('rejects unrecognized notation rather than silently guessing', () => {
    expect(() => parseCharacteristic('Bogus(9) 5s')).toThrow();
    expect(() => parseCharacteristic('')).toThrow();
  });

  it('rejects a period too short to fit the required segments', () => {
    expect(() => parseCharacteristic('Fl(5) 1s')).toThrow();
  });

  it('rejects Mo with an unsupported letter', () => {
    expect(() => parseCharacteristic('Mo(Z) 10s')).toThrow();
  });

  it('requires a period for types that need one', () => {
    expect(() => parseCharacteristic('Fl')).toThrow();
    expect(() => parseCharacteristic('Iso')).toThrow();
  });
});
