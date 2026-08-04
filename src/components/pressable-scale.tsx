import { cssInterop } from 'nativewind';
import { forwardRef } from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// Register className support on the wrapped component — Reanimated's HOC
// produces a new component identity that NativeWind's built-in Pressable
// support doesn't automatically recognize.
cssInterop(AnimatedPressable, { className: 'style' });

const PRESS_SCALE = 0.97;

/**
 * Drop-in Pressable with a consistent, restrained scale-down on press,
 * layered on top of whatever opacity feedback the caller already applies
 * via className (e.g. active:opacity-90, used throughout the app) — this
 * component only owns the physical "depress" feel, not the dimming, so
 * existing active: classes keep working unchanged.
 */
export const PressableScale = forwardRef<View, PressableProps>(function PressableScale(
  { onPressIn, onPressOut, ...props },
  ref,
) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      ref={ref}
      style={animatedStyle}
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
  );
});
