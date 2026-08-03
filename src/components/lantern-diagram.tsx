import { Fragment } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { LanternScene } from '@/content/types';

/**
 * Night-view light picture — one of the app's signature elements.
 *
 * The field depicts night at sea and is therefore always dark, independent
 * of the UI color scheme (like a photograph would be). Light colors below
 * are content colors, tuned to read as real lantern lights against the
 * night, not UI tokens.
 */
const NIGHT = '#050B12';
const HORIZON = '#16242F';

const LIGHT_COLORS: Record<string, string> = {
  white: '#F8F3E2',
  red: '#F2503C',
  green: '#38D07E',
  yellow: '#F2C230',
};

export function LanternDiagram({ scene }: { scene: LanternScene }) {
  const usedColors = [...new Set(scene.lights.map((l) => l.color))];

  return (
    <View className="rounded-xl overflow-hidden border border-fog/15">
      <Svg width="100%" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
        <Defs>
          {usedColors.map((color) => (
            <RadialGradient key={color} id={`glow-${color}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={LIGHT_COLORS[color]} stopOpacity={0.55} />
              <Stop offset="55%" stopColor={LIGHT_COLORS[color]} stopOpacity={0.14} />
              <Stop offset="100%" stopColor={LIGHT_COLORS[color]} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>

        <Rect x={0} y={0} width={100} height={60} fill={NIGHT} />
        {/* horizon */}
        <Line x1={0} y1={46} x2={100} y2={46} stroke={HORIZON} strokeWidth={0.5} />
        {/* faint swell lines */}
        <Path d="M8 51 q6 -1.4 12 0 t12 0" stroke={HORIZON} strokeWidth={0.4} fill="none" />
        <Path d="M62 54 q6 -1.4 12 0 t12 0" stroke={HORIZON} strokeWidth={0.4} fill="none" />

        {scene.hull === 'silhouette' && (
          <Path
            d="M30 46 L34 42.5 L68 42.5 L72 46 Z"
            fill={HORIZON}
            fillOpacity={0.8}
          />
        )}

        {scene.lights.map((light, i) => (
          <Fragment key={i}>
            <Circle cx={light.x} cy={light.y} r={7} fill={`url(#glow-${light.color})`} />
            <Circle cx={light.x} cy={light.y} r={1.6} fill={LIGHT_COLORS[light.color]} />
          </Fragment>
        ))}
      </Svg>
      {scene.captionSv ? (
        <View className="bg-surface px-4 py-2 border-t border-fog/10">
          <Text className="text-caption font-mono text-fog text-center uppercase tracking-widest">
            {scene.captionSv}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
