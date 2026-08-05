import { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { Palette } from '@/theme/tokens';

/**
 * One-time cold-launch moment: a sheet in the app's own background color
 * sweeps upward off the screen. Its bottom edge is cut with a shallow
 * notch, and a bird's-eye ship silhouette rides right at the point of
 * that notch — so the boat itself reads as the thing splitting the
 * screen open as it rises, bow first, one continuous motion rather than
 * a crossing animation followed by a separate cut to the app.
 *
 * Never rendered when reduced motion is on — see _layout.tsx, which skips
 * mounting this component entirely in that case rather than trying to
 * play an "instant version" of it.
 */

const SWEEP_MS = 1500;
const NOTCH_HALF_WIDTH = 68;
const NOTCH_APEX = 108;
const SHIP_HALF_BEAM = 32;
const SHIP_LENGTH = 96;

interface LaunchAnimationProps {
  palette: Palette;
  onDone: () => void;
}

export function LaunchAnimation({ palette, onDone }: LaunchAnimationProps) {
  const { width: W, height: H } = Dimensions.get('window');
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: SWEEP_MS, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const travel = H + NOTCH_APEX + 40;
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * travel }],
  }));

  const cx = W / 2;
  const apexY = H - NOTCH_APEX;

  // Full-screen rectangle with a shallow triangular notch cut into the
  // bottom-center edge — the ship's bow sits at the notch's point, so the
  // hull reads as the thing carving the opening rather than a passenger
  // riding a flat seam.
  const sheetPath = [
    `M 0 0`,
    `L ${W} 0`,
    `L ${W} ${H}`,
    `L ${cx + NOTCH_HALF_WIDTH} ${H}`,
    `L ${cx} ${apexY}`,
    `L ${cx - NOTCH_HALF_WIDTH} ${H}`,
    `L 0 ${H}`,
    'Z',
  ].join(' ');

  // Bird's-eye hull outline — symmetric, pointed bow leading (up, the
  // direction of travel), flaring to a blunt stern.
  const shipPath = [
    `M ${cx} ${apexY}`,
    `L ${cx + SHIP_HALF_BEAM} ${apexY + SHIP_LENGTH * 0.55}`,
    `L ${cx + SHIP_HALF_BEAM * 0.78} ${apexY + SHIP_LENGTH}`,
    `L ${cx - SHIP_HALF_BEAM * 0.78} ${apexY + SHIP_LENGTH}`,
    `L ${cx - SHIP_HALF_BEAM} ${apexY + SHIP_LENGTH * 0.55}`,
    'Z',
  ].join(' ');

  return (
    <Animated.View pointerEvents="none" style={[styles.sheet, sheetStyle]}>
      <Svg width={W} height={H}>
        <Path d={sheetPath} fill={palette.bg} />
        <Path d={shipPath} fill={palette.ink} />
        {/* Deckhouse, seen from above */}
        <Rect
          x={cx - 11}
          y={apexY + SHIP_LENGTH * 0.28}
          width={22}
          height={26}
          fill={palette.bg}
        />
        {/* Mast, seen from above */}
        <Circle cx={cx} cy={apexY + SHIP_LENGTH * 0.4} r={2.4} fill={palette.ink} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
