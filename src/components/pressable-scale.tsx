import { forwardRef } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const PRESS_SCALE = 0.97;

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** No function form — nothing in the app uses it, and it can't merge
   * with the scale animation's style array. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Drop-in Pressable with a consistent, restrained scale-down on press,
 * layered on top of whatever opacity feedback the caller already applies
 * via className (e.g. active:opacity-90, used throughout the app) — this
 * component only owns the physical "depress" feel, not the dimming, so
 * existing active: classes keep working unchanged.
 *
 * The scale lives on a plain outer Animated.View; className/style stay on
 * a normal Pressable underneath, which NativeWind already supports
 * natively. An earlier version wrapped Pressable itself with
 * Animated.createAnimatedComponent + cssInterop — confirmed on a real
 * device that combination silently dropped both the className-derived
 * layout (a flex-row collapsed to column) and the background color from
 * an explicit style prop. This shape avoids that interaction entirely.
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  { onPressIn, onPressOut, style, ...props },
  ref,
) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        ref={ref}
        style={style}
        onPressIn={(e) => {
          scale.value = withTiming(PRESS_SCALE, { duration: 100 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withTiming(1, { duration: 150 });
          onPressOut?.(e);
        }}
        {...props}
      />
    </Animated.View>
  );
});
