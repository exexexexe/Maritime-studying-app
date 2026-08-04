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
 * open/closed). Measures its content once via onLayout, then animates
 * height + opacity between 0 and that measured height. Any menu-like
 * disclosure in the app should use this rather than a one-off animation.
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
    <Animated.View style={[{ overflow: 'hidden' }, animatedStyle, style]}>
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== measuredHeight) setMeasuredHeight(h);
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
