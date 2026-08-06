import { forwardRef, type ComponentProps } from 'react';
import {
  Text,
  useColorScheme,
  View,
  type TextProps,
  type View as ViewRef,
  type ViewProps,
} from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { palette, type Palette } from '@/theme/tokens';

/**
 * Color-only styling for the app's semantic tokens (bg/surface/ink/fog/
 * brass/tide/urgent/starboard/port), resolved from React Native's
 * useColorScheme() rather than NativeWind's color utility classes
 * (bg-ink, text-fog, border-brass, and so on).
 *
 * NativeWind's CSS-variable dark-mode detection is confirmed broken on
 * native Android — it never resolves to anything but its 'light' fallback,
 * regardless of the real OS setting, while useColorScheme() (already used
 * for the tab bar) tracks it correctly. These three primitives are the
 * fix: keep className for everything color-independent (spacing, radius,
 * type scale, flex layout — all unaffected by the bug), move color
 * resolution through here instead. See UI rework Phase 1/3 commits.
 */

export type Tone = keyof Palette;

export function withAlpha(hex: string, pct: number): string {
  const alpha = Math.round((pct / 100) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}

interface ColorProps {
  bg?: Tone;
  bgOpacity?: number;
  borderTone?: Tone;
  borderOpacity?: number;
}

function colorStyleFor(
  p: Palette,
  { bg, bgOpacity, borderTone, borderOpacity }: ColorProps,
): { backgroundColor?: string; borderColor?: string } {
  const style: { backgroundColor?: string; borderColor?: string } = {};
  if (bg) style.backgroundColor = bgOpacity != null ? withAlpha(p[bg], bgOpacity) : p[bg];
  if (borderTone) {
    style.borderColor = borderOpacity != null ? withAlpha(p[borderTone], borderOpacity) : p[borderTone];
  }
  return style;
}

interface ThemedTextProps extends TextProps {
  /** Semantic color token. Defaults to 'ink'. */
  tone?: Tone;
  /** Alpha as a 0–100 percentage, matching className's text-fog/60 convention. */
  toneOpacity?: number;
}

export const ThemedText = forwardRef<Text, ThemedTextProps>(function ThemedText(
  { tone = 'ink', toneOpacity, style, ...props },
  ref,
) {
  const p = palette(useColorScheme());
  const color = toneOpacity != null ? withAlpha(p[tone], toneOpacity) : p[tone];
  return <Text ref={ref} style={[{ color }, style]} {...props} />;
});

interface ThemedViewProps extends ViewProps, ColorProps {
  /**
   * A restrained physical lift — the one surface per screen that should
   * read as raised above the rest, not a general decoration. Same shadow
   * recipe everywhere it's used so "elevated" stays a single deliberate
   * signal in the hierarchy rather than a knob tuned per screen.
   */
  elevated?: boolean;
}

const ELEVATION_STYLE = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.22,
  shadowRadius: 20,
  elevation: 8,
};

export const ThemedView = forwardRef<ViewRef, ThemedViewProps>(function ThemedView(
  { bg, bgOpacity, borderTone, borderOpacity, elevated, style, ...props },
  ref,
) {
  const p = palette(useColorScheme());
  const colorStyle = colorStyleFor(p, { bg, bgOpacity, borderTone, borderOpacity });
  return (
    <View ref={ref} style={[colorStyle, elevated ? ELEVATION_STYLE : null, style]} {...props} />
  );
});

interface ThemedPressableProps extends ComponentProps<typeof PressableScale>, ColorProps {}

/** PressableScale (Phase 2's press-feedback primitive) + a themed
 * background/border, for buttons — the one place motion and the color
 * fix both apply. */
export const ThemedPressable = forwardRef<ViewRef, ThemedPressableProps>(function ThemedPressable(
  { bg, bgOpacity, borderTone, borderOpacity, style, ...props },
  ref,
) {
  const p = palette(useColorScheme());
  const colorStyle = colorStyleFor(p, { bg, bgOpacity, borderTone, borderOpacity });
  return <PressableScale ref={ref} style={[colorStyle, style]} {...props} />;
});
