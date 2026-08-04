import { useEffect, useMemo } from 'react';
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { parseCharacteristic } from '@/lantern/characteristics';

export { RHYTHM } from './rhythm-map';

/**
 * Generalizes AnimatedLight's characteristic playback (see
 * src/components/animated-light.tsx and DESIGN-RHYTHM.md) from lantern SVGs
 * to UI chrome: any component can drive a style off the same real
 * light-characteristic timing the app teaches, instead of a one-off
 * animation invented per screen.
 *
 * Governing constraint (DESIGN-RHYTHM.md): motion must be traceable to an
 * actual characteristic with an actual meaning, never decoration.
 */

export interface RhythmOptions {
  /**
   * Loop indefinitely — for genuinely ongoing states (urgency while time
   * stays low, a persistent needs-review badge, loading while actually
   * loading). Default false: play the pattern once and settle at its final
   * value, which is the right shape for a one-off moment (answering a
   * question) — looping those forever would be decoration, not meaning,
   * and would violate the "never distracts from the question" rule.
   */
  loop?: boolean;
  /** Gate the animation on/off without unmounting the caller. */
  enabled?: boolean;
}

/**
 * Plays a light-characteristic's on/off/intensity sequence as a shared
 * 0–1 value ("on-ness"), for driving opacity/scale/etc. via
 * useAnimatedStyle. Under reduced motion, settles instantly at the
 * pattern's resting value and never animates — callers must render a
 * static equivalent (color, icon, text) so meaning survives either way;
 * this hook only owns the motion, never the sole carrier of meaning.
 */
export function useRhythm(characteristic: string, options: RhythmOptions = {}) {
  const { loop = false, enabled = true } = options;
  const reducedMotion = useReducedMotion();
  const spec = useMemo(() => parseCharacteristic(characteristic), [characteristic]);
  const restingValue = spec.segments.at(-1);
  const value: SharedValue<number> = useSharedValue(
    restingValue?.on ? (restingValue.intensity ?? 1) : 0,
  );

  useEffect(() => {
    const settledAt = restingValue?.on ? (restingValue.intensity ?? 1) : 0;
    if (reducedMotion || !enabled) {
      value.value = withTiming(settledAt, { duration: 150 });
      return;
    }
    const instant = Easing.steps(1);
    const steps = spec.segments.map((seg) =>
      withTiming(seg.on ? (seg.intensity ?? 1) : 0, { duration: seg.ms, easing: instant }),
    );
    value.value = loop ? withRepeat(withSequence(...steps), -1, false) : withSequence(...steps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, reducedMotion, enabled, loop]);

  return { value, reducedMotion };
}
