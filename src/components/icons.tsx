import type { ColorValue } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

/**
 * Hand-drawn 24px stroke icons — deliberately not a component-library icon set.
 * Stroke-based, geometric, instrument-panel character.
 */

interface IconProps {
  color: ColorValue;
  size?: number;
}

/** Compass rose — Översikt (dashboard). */
export function CompassIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
      <Path
        d="M12 4.5 L13.6 10.4 L19.5 12 L13.6 13.6 L12 19.5 L10.4 13.6 L4.5 12 L10.4 10.4 Z"
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={1.3} fill={color} />
    </Svg>
  );
}

/** Stacked chart sheets — Moduler. */
export function ChartsIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={6.5} y={3.5} width={13} height={13} rx={1} stroke={color} strokeWidth={1.5} />
      <Path
        d="M4.5 7.5 v11 a1 1 0 0 0 1 1 h11"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path d="M9.5 9.5 c2-2 4.5 1.5 7-1.5" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Circle cx={15.5} cy={12.5} r={1} fill={color} />
    </Svg>
  );
}

/** Ship's helm — Inställningar. */
export function HelmIcon({ color, size = 24 }: IconProps) {
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={6.5} stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={2} stroke={color} strokeWidth={1.3} />
      {spokes.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return (
          <Line
            key={deg}
            x1={12 + 6.5 * cos}
            y1={12 + 6.5 * sin}
            x2={12 + 10 * cos}
            y2={12 + 10 * sin}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}
