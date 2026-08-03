import { generateCalculation, GENERATOR_IDS } from '../navcalc';

describe('navcalc generators', () => {
  it.each(GENERATOR_IDS)('%s: structurally valid across 200 seeds', (id) => {
    for (let seed = 0; seed < 200; seed++) {
      const q = generateCalculation(id, seed);
      expect(q.questionSv.length).toBeGreaterThan(10);
      expect(q.explanationSv).toContain('\n'); // worked steps, not a one-liner
      expect(q.options).toHaveLength(4);
      expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
      const texts = q.options.map((o) => o.text);
      expect(new Set(texts).size).toBe(4); // no duplicate options
    }
  });

  it('is deterministic for a given seed', () => {
    for (const id of GENERATOR_IDS) {
      expect(generateCalculation(id, 42)).toEqual(generateCalculation(id, 42));
    }
  });

  it('varies across seeds', () => {
    const questions = new Set(
      Array.from({ length: 50 }, (_, s) => generateCalculation('compass-course', s).questionSv),
    );
    expect(questions.size).toBeGreaterThan(30);
  });

  it('compass-course applies Kk = Rk − missvisning − deviation', () => {
    for (let seed = 0; seed < 100; seed++) {
      const q = generateCalculation('compass-course', seed);
      const rk = Number(q.questionSv.match(/kurs är (\d{3})°/)![1]);
      const [, missAbs, missDir] = q.questionSv.match(/Missvisningen är (\d+)° (ostlig|västlig)/)!;
      const [, devAbs, devDir] = q.questionSv.match(/deviationen (\d+)° (ostlig|västlig)/)!;
      const miss = (missDir === 'ostlig' ? 1 : -1) * Number(missAbs);
      const dev = (devDir === 'ostlig' ? 1 : -1) * Number(devAbs);
      const expected = (((rk - miss - dev) % 360) + 360) % 360;
      expect(q.answer).toBe(expected);
      expect(q.options.find((o) => o.isCorrect)!.text).toBe(
        `${String(expected).padStart(3, '0')}°`,
      );
    }
  });

  it('true-course applies Rk = Kk + missvisning + deviation', () => {
    for (let seed = 0; seed < 100; seed++) {
      const q = generateCalculation('true-course', seed);
      const kk = Number(q.questionSv.match(/kompasskurs (\d{3})°/)![1]);
      const [, missAbs, missDir] = q.questionSv.match(/Missvisningen är (\d+)° (ostlig|västlig)/)!;
      const [, devAbs, devDir] = q.questionSv.match(/deviationen (\d+)° (ostlig|västlig)/)!;
      const miss = (missDir === 'ostlig' ? 1 : -1) * Number(missAbs);
      const dev = (devDir === 'ostlig' ? 1 : -1) * Number(devAbs);
      expect(q.answer).toBe((((kk + miss + dev) % 360) + 360) % 360);
    }
  });

  it('std-distance computes fart × tid', () => {
    for (let seed = 0; seed < 100; seed++) {
      const q = generateCalculation('std-distance', seed);
      const speed = Number(q.questionSv.match(/håller (\d+) knop/)![1]);
      const h = q.questionSv.match(/i (\d+) h/) ? Number(q.questionSv.match(/i (\d+) h/)![1]) : 0;
      const m = q.questionSv.match(/(\d+) min/) ? Number(q.questionSv.match(/(\d+) min/)![1]) : 0;
      expect(q.answer).toBeCloseTo((speed * (h * 60 + m)) / 60);
    }
  });

  it('current-speed adds följande ström and subtracts motström', () => {
    for (let seed = 0; seed < 100; seed++) {
      const q = generateCalculation('current-speed', seed);
      const stw = Number(q.questionSv.match(/vattnet är (\d+) knop/)![1]);
      const cur = Number(q.questionSv.match(/har (\d+) knop/)![1]);
      const against = q.questionSv.includes('motström');
      expect(q.answer).toBe(against ? stw - cur : stw + cur);
    }
  });

  it('rejects unknown generator ids', () => {
    expect(() => generateCalculation('nope', 1)).toThrow();
  });
});
