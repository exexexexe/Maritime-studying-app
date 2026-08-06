import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { ThemedText } from '@/components/themed';

/**
 * A small bearing dial for the orbit trainer (src/app/orbit/lantern.tsx) —
 * echoes icons.tsx's ChronometerIcon construction (ring + ticks + a
 * radial hand) rather than inventing a new visual vocabulary. The ring and
 * ticks are fixed; only the hand rotates, driven directly off the drag
 * gesture's shared value via useAnimatedStyle — no JS-thread involvement,
 * so it tracks the finger at full native smoothness independent of
 * whatever the rest of the screen is doing.
 *
 * "F" marks dead ahead (0°, the bow) — the one fixed reference the ticks
 * exist to give meaning to; the hand shows the student's current relative
 * bearing around the vessel.
 */

interface CompassReadoutProps {
  angle: SharedValue<number>;
  color: string;
  fogColor: string;
  size?: number;
}

const TICK_DEGREES = [0, 90, 180, 270];

export function CompassReadout({ angle, color, fogColor, size = 84 }: CompassReadoutProps) {
  const handStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={9} stroke={fogColor} strokeWidth={1.2} fill="none" opacity={0.5} />
        {TICK_DEGREES.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <Line
              key={deg}
              x1={12 + 7.6 * Math.sin(rad)}
              y1={12 - 7.6 * Math.cos(rad)}
              x2={12 + 9 * Math.sin(rad)}
              y2={12 - 9 * Math.cos(rad)}
              stroke={fogColor}
              strokeWidth={1.2}
              opacity={0.5}
            />
          );
        })}
        <Circle cx={12} cy={12} r={1} fill={fogColor} />
      </Svg>

      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, width: size, height: size }, handStyle]}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1={12} y1={12} x2={12} y2={4.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Circle cx={12} cy={4.5} r={1.3} fill={color} />
        </Svg>
      </Animated.View>

      <View style={{ position: 'absolute', top: -2, left: 0, right: 0, alignItems: 'center' }}>
        <ThemedText tone="fog" className="text-caption font-mono" toneOpacity={70}>
          F
        </ThemedText>
      </View>
    </View>
  );
}
