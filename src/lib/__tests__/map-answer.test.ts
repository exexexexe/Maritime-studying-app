import type { MapAnswer } from '@/content/types';

import {
  emptyMapAnswerValue,
  formatMapAnswerExpected,
  formatMapAnswerGiven,
  gradeMapAnswer,
  isMapAnswerComplete,
} from '../map-answer';

describe('gradeMapAnswer — bearing', () => {
  const answer: MapAnswer = { kind: 'bearing', expected: 134, unit: 'degrees', tolerance: 2 };

  it('accepts within tolerance', () => {
    expect(gradeMapAnswer(answer, { kind: 'bearing', text: '135' })).toBe(true);
    expect(gradeMapAnswer(answer, { kind: 'bearing', text: '132' })).toBe(true);
  });

  it('rejects outside tolerance', () => {
    expect(gradeMapAnswer(answer, { kind: 'bearing', text: '140' })).toBe(false);
  });

  it('wraps around 0/360 for the circular difference', () => {
    const wrap: MapAnswer = { kind: 'bearing', expected: 359, unit: 'degrees', tolerance: 3 };
    expect(gradeMapAnswer(wrap, { kind: 'bearing', text: '2' })).toBe(true);
    expect(gradeMapAnswer(wrap, { kind: 'bearing', text: '350' })).toBe(false);
  });

  it('accepts a comma decimal separator', () => {
    const dec: MapAnswer = { kind: 'bearing', expected: 134.5, unit: 'degrees', tolerance: 1 };
    expect(gradeMapAnswer(dec, { kind: 'bearing', text: '134,5' })).toBe(true);
  });

  it('rejects unparseable input', () => {
    expect(gradeMapAnswer(answer, { kind: 'bearing', text: 'nord' })).toBe(false);
    expect(gradeMapAnswer(answer, { kind: 'bearing', text: '' })).toBe(false);
  });
});

describe('gradeMapAnswer — distance/depth', () => {
  it('accepts within tolerance for distance', () => {
    const answer: MapAnswer = { kind: 'distance', expected: 4.2, unit: 'nm', tolerance: 0.3 };
    expect(gradeMapAnswer(answer, { kind: 'distance', text: '4.4' })).toBe(true);
    expect(gradeMapAnswer(answer, { kind: 'distance', text: '5' })).toBe(false);
  });

  it('accepts within tolerance for depth', () => {
    const answer: MapAnswer = { kind: 'depth', expected: 12, unit: 'meters', tolerance: 1 };
    expect(gradeMapAnswer(answer, { kind: 'depth', text: '11' })).toBe(true);
    expect(gradeMapAnswer(answer, { kind: 'depth', text: '9' })).toBe(false);
  });
});

describe('gradeMapAnswer — position', () => {
  const answer: MapAnswer = {
    kind: 'position',
    expected: { lat: 59.2, lon: 18.1 },
    unit: 'meters',
    tolerance: 500,
  };

  it('accepts a nearby point within the tolerance radius', () => {
    expect(gradeMapAnswer(answer, { kind: 'position', latText: '59.2005', lonText: '18.1003' })).toBe(
      true,
    );
  });

  it('rejects a point outside the tolerance radius', () => {
    expect(gradeMapAnswer(answer, { kind: 'position', latText: '59.25', lonText: '18.2' })).toBe(
      false,
    );
  });

  it('rejects incomplete input', () => {
    expect(gradeMapAnswer(answer, { kind: 'position', latText: '59.2', lonText: '' })).toBe(false);
  });
});

describe('isMapAnswerComplete', () => {
  it('is false for empty scalar input, true once parseable', () => {
    expect(isMapAnswerComplete({ kind: 'bearing', text: '' })).toBe(false);
    expect(isMapAnswerComplete({ kind: 'bearing', text: '134' })).toBe(true);
  });

  it('requires both lat and lon for position', () => {
    expect(isMapAnswerComplete({ kind: 'position', latText: '59.2', lonText: '' })).toBe(false);
    expect(isMapAnswerComplete({ kind: 'position', latText: '59.2', lonText: '18.1' })).toBe(true);
  });
});

describe('emptyMapAnswerValue', () => {
  it('shapes an empty value matching the answer kind', () => {
    expect(emptyMapAnswerValue({ kind: 'distance', expected: 1, unit: 'nm', tolerance: 1 })).toEqual({
      kind: 'distance',
      text: '',
    });
    expect(
      emptyMapAnswerValue({ kind: 'position', expected: { lat: 0, lon: 0 }, unit: 'm', tolerance: 1 }),
    ).toEqual({ kind: 'position', latText: '', lonText: '' });
  });
});

describe('formatting', () => {
  it('formats given and expected with units', () => {
    expect(formatMapAnswerGiven({ kind: 'bearing', text: '134' })).toBe('134°');
    expect(formatMapAnswerExpected({ kind: 'bearing', expected: 134, unit: 'degrees', tolerance: 2 })).toBe(
      '134°',
    );
  });
});
