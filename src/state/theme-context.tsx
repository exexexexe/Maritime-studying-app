import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { getThemeOverride, setThemeOverride, type ThemeOverride } from './theme';

interface AppColorSchemeValue {
  /** Resolved scheme every screen should render with — already accounts
   * for the user's override, so callers never need to touch the OS
   * setting or 'system' directly. */
  scheme: 'light' | 'dark';
  override: ThemeOverride;
  setOverride: (value: ThemeOverride) => void;
}

const AppColorSchemeContext = createContext<AppColorSchemeValue | null>(null);

export function AppColorSchemeProvider({ children }: { children: ReactNode }) {
  const osScheme = useColorScheme();
  const [override, setOverrideState] = useState<ThemeOverride>(() => getThemeOverride());

  // Dark is the app's default appearance (see theme/tokens.ts's palette()) —
  // mirror that here so an unrecognized/null OS value still resolves sanely.
  const scheme: 'light' | 'dark' =
    override === 'system' ? (osScheme === 'light' ? 'light' : 'dark') : override;

  const value = useMemo<AppColorSchemeValue>(
    () => ({
      scheme,
      override,
      setOverride: (next: ThemeOverride) => {
        setThemeOverride(next);
        setOverrideState(next);
      },
    }),
    [scheme, override],
  );

  return (
    <AppColorSchemeContext.Provider value={value}>{children}</AppColorSchemeContext.Provider>
  );
}

/**
 * The single source of truth for color scheme everywhere in the app —
 * replaces direct useColorScheme() calls, which only ever see the OS
 * setting and can't be overridden. Must be used inside AppColorSchemeProvider
 * (mounted once in src/app/_layout.tsx).
 */
export function useAppColorScheme(): AppColorSchemeValue {
  const ctx = useContext(AppColorSchemeContext);
  if (!ctx) throw new Error('useAppColorScheme must be used inside AppColorSchemeProvider');
  return ctx;
}
