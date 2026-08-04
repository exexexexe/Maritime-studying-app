import { View, type TextProps } from 'react-native';

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
 */

export type NumericReadoutSize = 'hero' | 'large' | 'standard';
export type NumericReadoutVariant = 'display' | 'mono';

interface NumericReadoutProps extends Omit<TextProps, 'style'> {
  value: string | number;
  unit?: string;
  tone?: Tone;
  size?: NumericReadoutSize;
  variant?: NumericReadoutVariant;
  className?: string;
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
  ...props
}: NumericReadoutProps) {
  const valueText = (
    <ThemedText
      tone={tone}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
      className={[SIZE_CLASS[size][variant], className].filter(Boolean).join(' ')}
      {...props}
    >
      {value}
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
