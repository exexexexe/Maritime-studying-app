import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { StabilityScene } from '@/content/types';

/**
 * Hull cross-section for stability items — the third native diagram type.
 * Content illustration with fixed colors (like a textbook figure), theme-
 * independent. Shows K/B/G/M on an upright or heeled midship section;
 * the heeled variant draws the buoyancy vertical through B′ up to M and
 * the righting arm GZ. Geometry is faithful: the buoyancy vertical
 * intersects the heeled centreline at M.
 */
const SKY = '#C7D4DC';
const SEA = '#3E5C6E';
const HULL = '#20241F';
const HULL_FILL = '#F2EFE5';
const POINT = '#C8332A';
const ARM = '#B07A18';

const W = 100;
const H = 64;
const WATER_Y = 34;
const CX = 50;
const KEEL_Y = 52;

// Heights above keel along the centreline (hull-local units).
const KB = 6; // centre of buoyancy
const KG = 14; // centre of gravity
const KM = 24; // metacentre

export function StabilityDiagram({ scene }: { scene: StabilityScene }) {
  const heelDeg = scene.variant === 'heeled' ? 18 : 0;
  const r = (heelDeg * Math.PI) / 180;
  const sin = Math.sin(r);
  const cos = Math.cos(r);

  /** Rotate a hull-local point (x right, h above keel) about the keel. */
  const pt = (x: number, h: number) => ({
    x: CX + x * cos + h * sin,
    y: KEEL_Y - h * cos + x * sin,
  });

  const kPt = { x: CX, y: KEEL_Y };
  const gPt = pt(0, KG);
  const mPt = pt(0, KM);
  // B shifts toward the immersed side; x chosen so the vertical through B′
  // passes exactly through M (definition of the metacentre).
  const bShift = heelDeg ? (KM - KB) * (sin / cos) : 0;
  const bPt = pt(bShift, KB);

  const marks = new Set(scene.markPoints ?? ['K', 'B', 'G', 'M']);

  return (
    <View className="rounded-xl overflow-hidden border border-fog/15">
      {/* width="100%" alone leaves height undefined on native — see the
          identical fix/comment in lantern-diagram.tsx. */}
      <Svg width="100%" style={{ aspectRatio: W / H }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <Rect x={0} y={0} width={W} height={WATER_Y} fill={SKY} />
        <Rect x={0} y={WATER_Y} width={W} height={H - WATER_Y} fill={SEA} />

        <G transform={`rotate(${heelDeg}, ${CX}, ${KEEL_Y})`}>
          <Path
            d={`M${CX - 22} 24 L${CX - 22} 42 Q${CX - 22} 52 ${CX - 10} 53 L${CX + 10} 53 Q${CX + 22} 52 ${CX + 22} 42 L${CX + 22} 24`}
            fill={HULL_FILL}
            stroke={HULL}
            strokeWidth={1.2}
          />
          <Line
            x1={CX}
            y1={20}
            x2={CX}
            y2={53}
            stroke={HULL}
            strokeWidth={0.5}
            strokeDasharray="2 1.5"
          />
        </G>

        {/* waterline stays horizontal */}
        <Line
          x1={4}
          y1={WATER_Y}
          x2={W - 4}
          y2={WATER_Y}
          stroke={HULL_FILL}
          strokeWidth={0.7}
          strokeDasharray="3 2"
        />

        {heelDeg > 0 && (
          <>
            <Line
              x1={bPt.x}
              y1={bPt.y}
              x2={bPt.x}
              y2={mPt.y}
              stroke={ARM}
              strokeWidth={0.7}
              strokeDasharray="1.5 1.5"
            />
            <Line x1={gPt.x} y1={gPt.y} x2={bPt.x} y2={gPt.y} stroke={ARM} strokeWidth={1.2} />
            <SvgText x={gPt.x - 9} y={gPt.y + 1.6} fontSize={5} fontStyle="italic" fill={ARM}>
              GZ
            </SvgText>
          </>
        )}

        {(
          [
            ['K', kPt],
            ['B', bPt],
            ['G', gPt],
            ['M', mPt],
          ] as const
        ).map(([label, p]) =>
          marks.has(label) ? (
            <G key={label}>
              <Circle cx={p.x} cy={p.y} r={1.6} fill={POINT} />
              <SvgText x={p.x + 3} y={p.y + 1.6} fontSize={5} fontStyle="italic" fill={HULL}>
                {label}
              </SvgText>
            </G>
          ) : null,
        )}
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
