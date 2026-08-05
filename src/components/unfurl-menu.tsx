import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface UnfurlMenuProps {
  open: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Generic expand/collapse disclosure — the app's one reusable "roll-out
 * menu" shape (per the UI rework brief: menus unfurl, they don't snap
 * open/closed). Animates height + opacity between 0 and the content's
 * measured height. Any menu-like disclosure in the app should use this
 * rather than a one-off animation.
 *
 * Measurement is done via an invisible, absolutely-positioned clone of
 * `children`, not by measuring inside the animated container itself —
 * that was the original approach, and on a real device (structural
 * rework's TrackBadge — this component's first actual usage; DESIGN-
 * RHYTHM.md had it as "not yet applied anywhere") the animated
 * container's own 0-height style meant onLayout inside it never reported
 * a real height, so it silently never opened. An absolutely-positioned
 * measurement clone sits outside normal flow, so its layout is never
 * constrained by the animated wrapper's current height.
 */
export function UnfurlMenu({ open, children, style }: UnfurlMenuProps) {
  const reducedMotion = useReducedMotion();
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    const target = open ? 1 : 0;
    progress.value = reducedMotion
      ? target
      : withTiming(target, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [open, reducedMotion, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: measuredHeight * progress.value,
    opacity: progress.value,
  }));

  return (
    <View style={style}>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}
        pointerEvents="none"
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== measuredHeight) setMeasuredHeight(h);
        }}
      >
        {children}
      </View>
      <Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>{children}</Animated.View>
    </View>
  );
}
