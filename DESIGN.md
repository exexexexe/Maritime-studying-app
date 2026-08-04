# Plugga Sjöexamen — Design System

The bar: **simple, clean, elite** — a well-made instrument, not a startup dashboard.
Reference material: admiralty chart typography, ECDIS displays, dive computers,
Bremont watch faces.

## Color tokens

Single source of truth: `src/theme/colors.js` (mirrored as CSS variables in
`src/global.css`; `npm run check:tokens` guards against drift). Dark ("varm
sjö") is the original warm deep-navy/brass palette; light ("kall sjö") is a
deliberate cool arctic chart blue-grey, not a warm-parchment inversion of
dark — `brass` stays warm in both so the one accent still reads against a
cooler ground.

| Token | Dark ("varm sjö", default) | Light ("kall sjö") | Role |
|---|---|---|---|
| `bg` | `#0A1620` deep bluish navy | `#DEE7ED` cool arctic paper | app background |
| `surface` | `#122232` charted water | `#EFF4F7` fresh paper | cards, raised surfaces |
| `ink` | `#ECE4D2` aged chart paper | `#16232E` chart ink | primary text |
| `fog` | `#8CA0AD` | `#526775` | secondary text, hairlines |
| `brass` | `#CBA765` | `#8A6D2F` | the one accent |
| `tide` | `#5FA8D3` | `#2C6C93` | secondary/informational accent |
| `urgent` | `#E08A4C` | `#B15B22` | Q/VQ-rhythm warning (see DESIGN-RHYTHM.md) |
| `starboard` | `#3FA372` | `#1F7A4D` | correct / go |
| `port` | `#C65D4E` | `#A63E30` | incorrect / stop |

`tide` and `urgent` were added during the UI rework — kept to exactly two so
the palette stays a "one accent plus semantics" system, not a sprawl.
`starboard`/`port` are untouched throughout.

Deliberately avoided: warm-cream + terracotta, black + neon green, and any
component-library default palette.

### How color is actually applied — read this before touching a screen

NativeWind's CSS-variable-driven dark-mode detection
(`@media (prefers-color-scheme)`) is confirmed broken on native Android — it
never resolves to dark regardless of the real OS setting. React Native's own
`useColorScheme()` hook tracks it correctly. So color resolution goes through
`src/components/themed.tsx`'s `ThemedText` / `ThemedView` / `ThemedPressable`
(props: `tone`/`toneOpacity`, `bg`/`bgOpacity`, `borderTone`/`borderOpacity`,
values are `Palette` keys resolved via `palette(useColorScheme())`), applied
as inline `style` — **never** `bg-ink`/`text-fog`/`border-brass` className
utilities for anything that must differ between themes. `className` still
owns everything color-independent: spacing, radius, type scale, flex layout.
Screen-root `SafeAreaView` backgrounds are set directly via
`style={{ backgroundColor: palette(useColorScheme()).bg }}` since they sit
above the Themed* primitives.

`ThemedPressable` wraps `PressableScale` (Phase 2's press-feedback
primitive), which is an outer `Animated.View` (scale transform only) around
an inner `Pressable` (layout/color). A `className` meant to affect the
pressable's own size in a flex row (e.g. `flex-1` for equal-width buttons)
lands on the inner `Pressable`, not the outer `Animated.View` that the
parent flexbox actually sees — wrap the call site in a plain
`<View className="flex-1">` instead of putting `flex-1` on the pressable.

## Typography

Three roles, bundled via `@expo-google-fonts` (all SIL OFL):

- **Display — Instrument Serif.** Headings only. Single weight; its engraved
  character echoes chart typography and its one-weight limitation enforces
  restraint.
- **Body/UI — IBM Plex Sans** (400/500/600). Everything readable.
- **Data — IBM Plex Mono** (400/500). Bearings, timers, counts, calculations,
  and small-caps labels (`text-caption font-mono uppercase tracking-widest`).

Type scale lives in `tailwind.config.js` (`display-xl` 34 → `caption` 12 plus
`data-lg` 30 for instrument readouts). **No ad hoc font sizes.**

## Signature elements

Boldness is spent here; everything else stays quiet.

1. **Nav-light feedback semantics** — correct/incorrect throughout the app is
   starboard green / port red, tying the core drill interaction to the subject
   itself.
2. **Native SVG diagrams** — lanterns, buoys, hull cross-sections drawn with
   `react-native-svg` in token colors, never bitmap clip-art. Icons are
   hand-drawn stroke SVGs (compass rose, chart sheets, helm), not an icon font.
3. **Rhythm as motion language** — UI chrome that moves (press feedback,
   urgency countdowns, streaks) borrows its timing from real maritime light
   characteristics rather than inventing a generic animation per screen. See
   [DESIGN-RHYTHM.md](DESIGN-RHYTHM.md) for the full system (`useRhythm`,
   `RHYTHM` map) and where it's actually wired up.

## Rules

- One thing per screen; drill screens show the question, the input, nothing else.
- Dark mode is the default; light mode changes colors only, never layout.
- Generous spacing, careful alignment, no decorative flourishes.
- Before a screen is "done", ask: *does this look assembled from a component
  library's defaults, or designed for this subject?* If the former, revise.
