import { Fragment, useEffect, useMemo } from 'react';
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

// Glow rendered as stacked flat-opacity circles rather than an SVG
// RadialGradient — gradients (Defs/RadialGradient/Stop) failed to paint at
// all on-device under this React Native/Fabric + react-native-svg
// combination (confirmed on a real Android build; flat fills render fine).
// This keeps the same soft-glow look with zero gradient dependency.
const GLOW_LAYERS = [
  { r: 7, opacity: 0.12 },
  { r: 4.4, opacity: 0.22 },
  { r: 2.6, opacity: 0.4 },
] as const;

interface AnimatedLightProps {
  characteristic: string;
  cx: number;
  cy: number;
  color: string;
  glow?: boolean;
}

/**
 * A single light that blinks its real maritime rhythm (see DESIGN-RHYTHM.md
 * and src/lantern/characteristics.ts): the core dot and its glow layers all
 * share one opacity value (each glow layer scaled by its own base opacity)
 * so they blink together, not independently.
 *
 * Segments snap instantly to on/off — real lights don't fade — using
 * Easing.steps(1) to hold each value for its segment's duration, looped
 * indefinitely.
 *
 * Respects the system's reduce-motion setting: renders statically "on"
 * instead of animating, so the light stays visible and legible without
 * motion. The caller is responsible for also showing the characteristic's
 * notation as a caption — that's how the meaning survives independent of
 * whether the pulse itself is playing.
 *
 * The animation-start effect below must be useEffect, not useMemo — this
 * was a real bug (found while building the Phase 6 sprint screen, which
 * re-renders every second from its countdown): writing to a shared value
 * during render is undefined behavior under frequent re-renders, and
 * manifested as the light silently never appearing at all despite the
 * diagram frame itself rendering correctly. useEffect runs once per commit
 * regardless of how often the parent re-renders; useMemo does not carry
 * that guarantee for side effects.
 *
 * useReducedMotion() itself only reflects the OS setting as of the app's
 * last cold start, not live — toggling the setting (or an adb/dev-tool
 * override) while the app is already running has no effect until the app
 * is fully closed and reopened. If a light looks stuck static+captioned
 * (or the reverse) with no code change to explain it, that's almost always
 * a stale process, not a real bug — force-stop and relaunch before digging
 * further.
 */
export function AnimatedLight({ characteristic, cx, cy, color, glow = true }: AnimatedLightProps) {
  const reducedMotion = useReducedMotion();
  const spec = useMemo(() => parseCharacteristic(characteristic), [characteristic]);

  const opacity = useSharedValue(spec.segments[0]?.on ? (spec.segments[0]?.intensity ?? 1) : 0);

  useEffect(() => {
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

  const coreProps = useAnimatedProps(() => ({ opacity: opacity.value }));
  const glow0Props = useAnimatedProps(() => ({ opacity: opacity.value * GLOW_LAYERS[0].opacity }));
  const glow1Props = useAnimatedProps(() => ({ opacity: opacity.value * GLOW_LAYERS[1].opacity }));
  const glow2Props = useAnimatedProps(() => ({ opacity: opacity.value * GLOW_LAYERS[2].opacity }));
  const glowProps = [glow0Props, glow1Props, glow2Props];

  return (
    <Fragment>
      {glow
        ? GLOW_LAYERS.map((layer, i) => (
            <AnimatedCircle key={i} cx={cx} cy={cy} r={layer.r} fill={color} animatedProps={glowProps[i]} />
          ))
        : null}
      <AnimatedCircle cx={cx} cy={cy} r={1.6} fill={color} animatedProps={coreProps} />
    </Fragment>
  );
}
