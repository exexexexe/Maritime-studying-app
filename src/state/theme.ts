import { getMeta, setMeta } from '@/db';

/**
 * User-controlled theme override, stored alongside the active track in the
 * meta key/value table. 'system' (the default) follows the OS setting;
 * 'light'/'dark' pin the app regardless of it. See theme-context.tsx for
 * how this resolves to an actual color scheme.
 */

const KEY = 'theme_override';

export type ThemeOverride = 'system' | 'light' | 'dark';

const DEFAULT_OVERRIDE: ThemeOverride = 'system';
const VALID: ThemeOverride[] = ['system', 'light', 'dark'];

export function getThemeOverride(): ThemeOverride {
  const stored = getMeta(KEY);
  return VALID.includes(stored as ThemeOverride) ? (stored as ThemeOverride) : DEFAULT_OVERRIDE;
}

export function setThemeOverride(value: ThemeOverride): void {
  setMeta(KEY, value);
}
