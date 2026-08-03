import { itemsForTrack } from '@/content';

import { assembleExam, categoryOf, examConfig, tallyByModule } from '../assemble';

describe('assembleExam', () => {
  it('clamps the full klass8 exam to the available pool for now', () => {
    const exam = assembleExam('klass8', 'full', 1);
    const pool = itemsForTrack('klass8');
    expect(exam.length).toBe(Math.min(examConfig('klass8').full.questions, pool.length));
  });

  it('hits the quick-exam target count exactly', () => {
    const exam = assembleExam('klass8', 'quick', 7);
    expect(exam.length).toBe(examConfig('klass8').quick.questions);
  });

  it('contains no duplicate items', () => {
    const exam = assembleExam('klass8', 'quick', 3);
    expect(new Set(exam.map((i) => i.id)).size).toBe(exam.length);
  });

  it('is deterministic per seed and varies across seeds', () => {
    const a = assembleExam('klass8', 'quick', 11).map((i) => i.id);
    const b = assembleExam('klass8', 'quick', 11).map((i) => i.id);
    const c = assembleExam('klass8', 'quick', 12).map((i) => i.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('respects the category mix on the quick exam within pool limits', () => {
    const exam = assembleExam('klass8', 'quick', 5);
    const config = examConfig('klass8');
    const pool = itemsForTrack('klass8');
    const counts: Record<string, number> = {};
    for (const item of exam) counts[categoryOf(item)] = (counts[categoryOf(item)] ?? 0) + 1;

    for (const cat of ['theory', 'diagram', 'calculation', 'image'] as const) {
      const quota = Math.floor(exam.length * config.mix[cat]);
      const available = pool.filter((i) => categoryOf(i) === cat).length;
      expect(counts[cat] ?? 0).toBeGreaterThanOrEqual(Math.min(quota, available));
    }
    // diagram and image content must actually appear — the realistic-mix rule
    expect(counts.diagram ?? 0).toBeGreaterThan(0);
    expect(counts.image ?? 0).toBeGreaterThan(0);
    expect(counts.calculation ?? 0).toBeGreaterThan(0);
  });

  it('only includes items tagged for the track', () => {
    const exam = assembleExam('vhf', 'quick', 1);
    expect(exam.length).toBeGreaterThan(0);
    for (const item of exam) expect(item.tracks).toContain('vhf');
  });
});

describe('tallyByModule', () => {
  it('groups answers by module, weakest first', () => {
    const pool = itemsForTrack('klass8');
    const lantern = pool.filter((i) => i.id.startsWith('lan-'));
    const colreg = pool.filter((i) => i.id.startsWith('col-'));
    const answers = [
      ...lantern.slice(0, 4).map((item) => ({ item, correct: true })),
      ...colreg.slice(0, 4).map((item, k) => ({ item, correct: k === 0 })),
    ];
    const tally = tallyByModule(answers);
    expect(tally[0].moduleId).toBe('mod-colreg'); // 25% — weakest first
    expect(tally[0].correct).toBe(1);
    expect(tally[0].total).toBe(4);
    expect(tally.at(-1)!.moduleId).toBe('mod-lanterns'); // 100%
  });
});
