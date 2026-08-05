import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import type { ViewProps } from 'react-native';

const STEP_MS = 40;
const DURATION_MS = 220;
const MAX_STEPS = 8; // caps the tail delay on longer lists — stays snappy

interface StaggerInProps extends ViewProps {
  /** Position in the list — drives the per-item delay. */
  index: number;
  children: React.ReactNode;
}

/**
 * Wraps one row of a list so it fades/slides in with a slight offset per
 * index, instead of the whole list appearing at once. Reduced motion
 * drops the `entering` animation entirely rather than instant-completing
 * it — Reanimated's layout-animation prop has no "instant" mode, so
 * omitting it is the equivalent of every other reduced-motion path in
 * this app (settle immediately, no motion).
 *
 * Delay is capped at `MAX_STEPS` items so an 11-row list doesn't drag the
 * last row in half a second after the first — restrained, not a light
 * show.
 */
export function StaggerIn({ index, children, style, ...props }: StaggerInProps) {
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      style={style}
      entering={
        reducedMotion
          ? undefined
          : FadeInDown.delay(Math.min(index, MAX_STEPS) * STEP_MS).duration(DURATION_MS)
      }
      {...props}
    >
      {children}
    </Animated.View>
  );
}
