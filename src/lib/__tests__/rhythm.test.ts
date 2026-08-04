import { parseCharacteristic } from '@/lantern/characteristics';

import { RHYTHM } from '../rhythm-map';

describe('RHYTHM', () => {
  it('every semantic mapping parses as valid characteristic notation', () => {
    for (const [state, notation] of Object.entries(RHYTHM)) {
      expect(() => parseCharacteristic(notation)).not.toThrow();
    }
  });

  it('one-off states (correct/streak) resolve to a settled resting value, not mid-cycle', () => {
    // Iso and slow Fl both end their period dark — useRhythm settles there
    // for non-looping playback, which should read as "off", not a jarring cut.
    const correct = parseCharacteristic(RHYTHM.correct);
    const streak = parseCharacteristic(RHYTHM.streak);
    expect(correct.segments.at(-1)?.on).toBe(false);
    expect(streak.segments.at(-1)?.on).toBe(false);
  });
});
