import { Fragment, useMemo } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Circle } from 'react-native-svg';

import { parseCharacteristic } from '@/lantern/characteristics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedLightProps {
  characteristic: string;
  cx: number;
  cy: number;
  color: string;
  /** Gradient id (defined by the caller's <Defs>) for the glow halo, if any. */
  glowId?: string;
}

/**
 * A single light that blinks its real maritime rhythm (see DESIGN-RHYTHM.md
 * and src/lantern/characteristics.ts): the core dot and its glow halo share
 * one opacity value so they blink together, not independently.
 *
 * Segments snap instantly to on/off — real lights don't fade — using
 * Easing.step0 to hold each value for its segment's duration, looped
 * indefinitely.
 *
 * Respects the system's reduce-motion setting: renders statically "on"
 * instead of animating, so the light stays visible and legible without
 * motion. The caller is responsible for also showing the characteristic's
 * notation as a caption — that's how the meaning survives independent of
 * whether the pulse itself is playing.
 */
export function AnimatedLight({ characteristic, cx, cy, color, glowId }: AnimatedLightProps) {
  const reducedMotion = useReducedMotion();
  const spec = useMemo(() => parseCharacteristic(characteristic), [characteristic]);

  const opacity = useSharedValue(spec.segments[0]?.on ? (spec.segments[0]?.intensity ?? 1) : 0);

  useMemo(() => {
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    // Easing.steps(1) snaps to the end value immediately and holds it for
    // the full duration — real lights switch instantly, they don't fade.
    const instant = Easing.steps(1);
    const steps = spec.segments.map((seg) =>
      withTiming(seg.on ? (seg.intensity ?? 1) : 0, { duration: seg.ms, easing: instant }),
    );
    opacity.value = withRepeat(withSequence(...steps), -1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, reducedMotion]);

  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.value }));

  return (
    <Fragment>
      {glowId ? <AnimatedCircle cx={cx} cy={cy} r={7} fill={`url(#${glowId})`} animatedProps={animatedProps} /> : null}
      <AnimatedCircle cx={cx} cy={cy} r={1.6} fill={color} animatedProps={animatedProps} />
    </Fragment>
  );
}
