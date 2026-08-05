import type { Item } from '@/content/types';

import { gradeRadioProcedure } from '../radio-procedure';

const item: Item = {
  id: 'test-radio-001',
  topicId: 'top-vhf-mayday',
  tracks: ['vhf'],
  type: 'radio_procedure',
  options: [],
  explanationSv: 'test',
  authorReviewed: false,
  callType: 'mayday',
  scenario: 'test scenario',
  vesselName: 'Maria',
  requiredBlocks: [
    { id: 'b1', text: 'MAYDAY', order: 1 },
    { id: 'b2', text: 'MAYDAY', order: 2 },
    { id: 'b3', text: 'MAYDAY', order: 3 },
    { id: 'b4', text: 'Detta är Maria', order: 4 },
    { id: 'b5', text: 'Maria', order: 5 },
  ],
  distractorBlocks: [
    { id: 'd1', text: 'PAN-PAN' },
    { id: 'd2', text: 'Väder: klart' },
  ],
};

describe('gradeRadioProcedure', () => {
  it('accepts an exact match', () => {
    const result = gradeRadioProcedure(item, ['b1', 'b2', 'b3', 'b4', 'b5']);
    expect(result.correct).toBe(true);
  });

  it('rejects the right blocks in the wrong order', () => {
    const result = gradeRadioProcedure(item, ['b1', 'b2', 'b3', 'b5', 'b4']);
    expect(result.correct).toBe(false);
    expect(result.feedbackSv).toMatch(/fel ordning/);
  });

  it('accepts identical-text blocks placed in any internal order (MAYDAY ×3 is interchangeable)', () => {
    // b1/b2/b3 are all "MAYDAY" — the student has no way to tell them
    // apart, so any permutation of them in positions 1–3 must grade as
    // correct, not just the exact authored id order.
    const result = gradeRadioProcedure(item, ['b3', 'b1', 'b2', 'b4', 'b5']);
    expect(result.correct).toBe(true);
  });

  it('rejects a missing required block', () => {
    const result = gradeRadioProcedure(item, ['b1', 'b2', 'b4', 'b5']);
    expect(result.correct).toBe(false);
    expect(result.feedbackSv).toMatch(/saknade/);
  });

  it('rejects an included distractor', () => {
    const result = gradeRadioProcedure(item, ['b1', 'b2', 'b3', 'b4', 'b5', 'd1']);
    expect(result.correct).toBe(false);
    expect(result.feedbackSv).toMatch(/inte hör hemma/);
  });

  it('rejects an empty attempt', () => {
    const result = gradeRadioProcedure(item, []);
    expect(result.correct).toBe(false);
    expect(result.feedbackSv).toMatch(/saknade/);
  });

  it('reports both a distractor and missing blocks when both apply', () => {
    const result = gradeRadioProcedure(item, ['b1', 'd1']);
    expect(result.correct).toBe(false);
    expect(result.feedbackSv).toMatch(/inte hör hemma/);
    expect(result.feedbackSv).toMatch(/saknade/);
  });

  it('handles an item with no requiredBlocks without throwing', () => {
    const bare: Item = { ...item, requiredBlocks: undefined, distractorBlocks: undefined };
    expect(() => gradeRadioProcedure(bare, ['x'])).not.toThrow();
    expect(gradeRadioProcedure(bare, ['x']).correct).toBe(false);
  });
});
