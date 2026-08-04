import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import type { BuoyScene } from '@/content/types';

/**
 * Daytime buoy diagram — sibling of LanternDiagram. Like that one, this is
 * a content illustration: sky/sea/buoy colors are fixed content colors
 * (IALA colors must read true), independent of the UI scheme.
 */
const SKY = '#C7D4DC';
const SEA = '#3E5C6E';
const BUOY: Record<string, string> = {
  red: '#C8332A',
  green: '#1E7A43',
  yellow: '#E8B416',
  black: '#20241F',
  white: '#F2EFE5',
};

const FIELD_W = 100;
const FIELD_H = 60;
const WATER_Y = 48;
const CX = 50;

function TopMark({ kind }: { kind: NonNullable<BuoyScene['topmark']> }) {
  const y = 14; // bottom of the topmark area; body starts just below
  const s = 3.6; // cone half-width
  const cone = (pointUp: boolean, cy: number) =>
    pointUp
      ? `M${CX - s} ${cy} L${CX + s} ${cy} L${CX} ${cy - 2 * s} Z`
      : `M${CX - s} ${cy - 2 * s} L${CX + s} ${cy - 2 * s} L${CX} ${cy} Z`;

  switch (kind) {
    case 'cones-up':
      return (
        <>
          <Path d={cone(true, y - 9)} fill={BUOY.black} />
          <Path d={cone(true, y)} fill={BUOY.black} />
        </>
      );
    case 'cones-down':
      return (
        <>
          <Path d={cone(false, y - 9)} fill={BUOY.black} />
          <Path d={cone(false, y)} fill={BUOY.black} />
        </>
      );
    case 'cones-base-to-base':
      return (
        <>
          <Path d={cone(true, y - 9)} fill={BUOY.black} />
          <Path d={cone(false, y)} fill={BUOY.black} />
        </>
      );
    case 'cones-point-to-point':
      return (
        <>
          <Path d={cone(false, y - 9)} fill={BUOY.black} />
          <Path d={cone(true, y)} fill={BUOY.black} />
        </>
      );
    case 'spheres-2':
      return (
        <>
          <Circle cx={CX} cy={y - 11} r={3} fill={BUOY.black} />
          <Circle cx={CX} cy={y - 3.5} r={3} fill={BUOY.black} />
        </>
      );
    case 'sphere-red':
      return <Circle cx={CX} cy={y - 4} r={3.4} fill={BUOY.red} />;
    case 'x-yellow':
      return (
        <>
          <Line x1={CX - 3.4} y1={y - 8} x2={CX + 3.4} y2={y - 1} stroke={BUOY.yellow} strokeWidth={1.8} />
          <Line x1={CX + 3.4} y1={y - 8} x2={CX - 3.4} y2={y - 1} stroke={BUOY.yellow} strokeWidth={1.8} />
        </>
      );
    case 'cone-up-green':
      return <Path d={cone(true, y)} fill={BUOY.green} />;
    case 'can-red':
      return <Rect x={CX - 3.2} y={y - 7} width={6.4} height={7} fill={BUOY.red} />;
  }
}

export function BuoyDiagram({ scene }: { scene: BuoyScene }) {
  const bodyTop = 15;
  const bodyBottom = WATER_Y + 2;
  const bodyH = bodyBottom - bodyTop;
  const halfW = 7;

  return (
    <View className="rounded-xl overflow-hidden border border-fog/15">
      {/* width="100%" alone leaves height undefined on native — see the
          identical fix/comment in lantern-diagram.tsx. */}
      <Svg
        width="100%"
        style={{ aspectRatio: FIELD_W / FIELD_H }}
        viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Rect x={0} y={0} width={FIELD_W} height={WATER_Y} fill={SKY} />
        <Rect x={0} y={WATER_Y} width={FIELD_W} height={FIELD_H - WATER_Y} fill={SEA} />
        <Path d={`M6 ${WATER_Y + 6} q6 -1.6 12 0 t12 0`} stroke="#2E4756" strokeWidth={0.6} fill="none" />
        <Path d={`M64 ${WATER_Y + 9} q6 -1.6 12 0 t12 0`} stroke="#2E4756" strokeWidth={0.6} fill="none" />

        {scene.pattern === 'vertical-stripes' ? (
          scene.colors.map((c, i) => {
            const w = (halfW * 2) / scene.colors.length;
            return (
              <Rect
                key={i}
                x={CX - halfW + i * w}
                y={bodyTop}
                width={w}
                height={bodyH}
                fill={BUOY[c]}
              />
            );
          })
        ) : (
          scene.colors.map((c, i) => {
            const h = bodyH / scene.colors.length;
            return (
              <Rect
                key={i}
                x={CX - halfW}
                y={bodyTop + i * h}
                width={halfW * 2}
                height={h}
                fill={BUOY[c]}
              />
            );
          })
        )}

        {scene.topmark ? <TopMark kind={scene.topmark} /> : null}
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
