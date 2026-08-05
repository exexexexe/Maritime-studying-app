import { useEffect, useRef, useState } from 'react';
import { View, type TextProps } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ThemedText, type Tone } from '@/components/themed';

/**
 * The app's one shared component for "this is the number that matters on
 * this screen" — the scale-contrast principle (see DESIGN.md's Signature
 * elements): pick the single most important number on a screen and let it
 * be genuinely large, while everything else stays deliberately quiet by
 * comparison. Reused as-is wherever a new screen needs the same confident
 * numeric readout, rather than reimplementing large-number styling ad hoc
 * per screen.
 *
 * `size="hero"` is reserved for that one dominant number per screen — not
 * a general-purpose "big text" utility. `size="large"` is the previous
 * data-lg/display-xl scale, for a readout that matters but isn't the
 * screen's single focal point (e.g. a secondary stat next to a hero
 * number). `variant="mono"` (tabular figures) is for anything read as a
 * precise instrument value — timers, bearings, percentages; `"display"`
 * (Instrument Serif) is for a number read more like a headline — a count,
 * a score.
 *
 * `unit` (e.g. "%") renders as a separate, smaller sibling — not appended
 * into the scaled string. Concatenating a suffix into one adjustsFontSizeToFit
 * string was tried first and broke on device: the Text wrapped the unit
 * onto its own line despite numberOfLines={1}, splitting "33 %" into "33"
 * over a stray "%". Keeping them as siblings with baseline alignment
 * avoids relying on that shrink-to-fit/no-wrap combination at all.
 *
 * `countUp` animates the displayed integer from its previous value to a
 * new numeric `value` (rAF-driven, ease-out, ~550ms) instead of just
 * swapping the text. Opt-in and numeric-only on purpose — the sprint
 * drill's countdown also uses `size="hero"` but is already a live,
 * continuously-changing readout; animating *every* per-second tick would
 * be noise, not a reveal. Only pass `countUp` at a value's genuine
 * reveal/change moments (Dashboard's due-count, a module's due-count, an
 * exam score once computed).
 */

export type NumericReadoutSize = 'hero' | 'large' | 'standard';
export type NumericReadoutVariant = 'display' | 'mono';

const COUNT_UP_MS = 550;

function useCountUp(target: number, enabled: boolean): number {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef<number>(target);
  const mounted = useRef(false);

  useEffect(() => {
    if (!enabled || reducedMotion) {
      setDisplay(target);
      prevTarget.current = target;
      return;
    }
    // First mount counts up from 0 — a real "reveal", not just a jump-cut.
    const from = mounted.current ? prevTarget.current : 0;
    mounted.current = true;
    if (from === target) {
      setDisplay(target);
      prevTarget.current = target;
      return;
    }
    prevTarget.current = target;
    const startTime = Date.now();
    let raf: ReturnType<typeof requestAnimationFrame>;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startTime) / COUNT_UP_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled, reducedMotion]);

  return display;
}

interface NumericReadoutProps extends Omit<TextProps, 'style'> {
  value: string | number;
  unit?: string;
  tone?: Tone;
  size?: NumericReadoutSize;
  variant?: NumericReadoutVariant;
  className?: string;
  /** Animate from the previous value to this one instead of swapping
   * instantly. Numeric values only — see the note above. */
  countUp?: boolean;
}

const SIZE_CLASS: Record<NumericReadoutSize, Record<NumericReadoutVariant, string>> = {
  hero: { display: 'text-display-hero font-display', mono: 'text-data-hero font-mono-medium' },
  large: { display: 'text-display-xl font-display', mono: 'text-data-lg font-mono-medium' },
  standard: { display: 'text-title font-sans-medium', mono: 'text-body font-mono-medium' },
};

const UNIT_CLASS: Record<NumericReadoutSize, string> = {
  hero: 'text-display font-display',
  large: 'text-title font-sans-medium',
  standard: 'text-body font-sans-medium',
};

export function NumericReadout({
  value,
  unit,
  tone = 'ink',
  size = 'hero',
  variant = 'display',
  className,
  countUp = false,
  ...props
}: NumericReadoutProps) {
  const canCountUp = countUp && typeof value === 'number';
  const animated = useCountUp(canCountUp ? (value as number) : 0, canCountUp);
  const displayValue = canCountUp ? animated : value;

  const valueText = (
    <ThemedText
      tone={tone}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
      className={[SIZE_CLASS[size][variant], className].filter(Boolean).join(' ')}
      {...props}
    >
      {displayValue}
    </ThemedText>
  );

  if (!unit) return valueText;

  return (
    <View className="flex-row items-baseline">
      {valueText}
      <ThemedText tone={tone} className={[UNIT_CLASS[size], 'ml-2'].join(' ')}>
        {unit}
      </ThemedText>
    </View>
  );
}
