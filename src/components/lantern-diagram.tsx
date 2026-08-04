import { Fragment } from 'react';
import { Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import type { LanternScene } from '@/content/types';

import { AnimatedLight } from './animated-light';

/**
 * Night-view light picture — one of the app's signature elements.
 *
 * The field depicts night at sea and is therefore always dark, independent
 * of the UI color scheme (like a photograph would be). Light colors below
 * are content colors, tuned to read as real lantern lights against the
 * night, not UI tokens.
 *
 * Glow is stacked flat-opacity circles, not an SVG RadialGradient —
 * Defs/RadialGradient/Stop failed to paint at all on a real Android device
 * under this React Native/Fabric + react-native-svg combination (plain
 * shape fills render fine). See AnimatedLight for the animated version of
 * the same technique.
 */
const NIGHT = '#050B12';
const HORIZON = '#16242F';

const LIGHT_COLORS: Record<string, string> = {
  white: '#F8F3E2',
  red: '#F2503C',
  green: '#38D07E',
  yellow: '#F2C230',
  blue: '#4C8DF5', // identification flash light (police/SAR vessels, submarines)
};

const GLOW_LAYERS = [
  { r: 7, opacity: 0.12 },
  { r: 4.4, opacity: 0.22 },
  { r: 2.6, opacity: 0.4 },
] as const;

export function LanternDiagram({ scene }: { scene: LanternScene }) {
  const reducedMotion = useReducedMotion();
  // Shown as text ONLY when motion is reduced — this is how the
  // characteristic's meaning survives without the pulse (per
  // DESIGN-RHYTHM.md). While the animation is actually playing, printing
  // the notation here would just hand the student the answer to "identify
  // this characteristic" items, so it stays silent then.
  const characteristicNotation = reducedMotion
    ? [...new Set(scene.lights.map((l) => l.characteristic).filter(Boolean))].join(' · ')
    : '';

  return (
    <View className="rounded-xl overflow-hidden border border-fog/15">
      {/* width="100%" alone leaves height undefined on native — RN's layout
          engine can't derive it from a percentage width, so the canvas
          collapses to zero height (confirmed on a real Android device: the
          whole diagram rendered nothing). style.aspectRatio fixes it. */}
      <Svg width="100%" style={{ aspectRatio: 100 / 60 }} viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet">
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

        {scene.lights.map((light, i) =>
          light.characteristic ? (
            <AnimatedLight
              key={i}
              characteristic={light.characteristic}
              cx={light.x}
              cy={light.y}
              color={LIGHT_COLORS[light.color]}
            />
          ) : (
            <Fragment key={i}>
              {GLOW_LAYERS.map((layer, j) => (
                <Circle
                  key={j}
                  cx={light.x}
                  cy={light.y}
                  r={layer.r}
                  fill={LIGHT_COLORS[light.color]}
                  fillOpacity={layer.opacity}
                />
              ))}
              <Circle cx={light.x} cy={light.y} r={1.6} fill={LIGHT_COLORS[light.color]} />
            </Fragment>
          ),
        )}
      </Svg>
      {scene.captionSv || characteristicNotation ? (
        <View className="bg-surface px-4 py-2 border-t border-fog/10">
          <Text className="text-caption font-mono text-fog text-center uppercase tracking-widest">
            {[scene.captionSv, characteristicNotation].filter(Boolean).join(' · ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
