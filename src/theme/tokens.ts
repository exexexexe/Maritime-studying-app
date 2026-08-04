/**
 * Typed access to the design tokens for code that can't use className
 * (react-native-svg fills, navigation themes, StatusBar, etc.).
 */
const colors = require('./colors') as {
  dark: Palette;
  light: Palette;
};

export interface Palette {
  bg: string;
  surface: string;
  ink: string;
  fog: string;
  brass: string;
  /** Secondary/informational accent — never the primary call to action. */
  tide: string;
  /** Q/VQ-rhythm warning — low exam time, review backlog. */
  urgent: string;
  starboard: string;
  port: string;
}

export const palettes: { dark: Palette; light: Palette } = {
  dark: colors.dark,
  light: colors.light,
};

export function palette(scheme: string | null | undefined): Palette {
  // Dark is the app's default appearance.
  return scheme === 'light' ? palettes.light : palettes.dark;
}

/** Font family names as registered with expo-font. */
export const fonts = {
  display: 'InstrumentSerif_400Regular',
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemiBold: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;
