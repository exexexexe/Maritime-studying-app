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
`data-lg` 30 for instrument readouts, `display-hero` 88 / `data-hero` 76 for
the one dominant number per screen — see Signature elements below). **No ad
hoc font sizes.**

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
4. **Scale contrast, one dominant number per screen** — pick the single most
   important number on a screen and let it be genuinely large
   (`src/components/numeric-readout.tsx`'s `NumericReadout`, `size="hero"`),
   while everything else stays deliberately quiet by comparison. Applied to
   Dashboard's due-count, module detail's due-count, the exam-results score,
   and the sprint drill's countdown. This is a restraint, not a license —
   `size="hero"` is reserved for that one number per screen, not a
   general-purpose "make it big" utility. Pairs with demoting secondary
   content to flat, borderless `bg` `bgOpacity={45}` panels (no border, no
   shadow) so the one elevated/hero card actually reads as elevated.
5. **Three restrained micro-interactions**, layered on top of the structure
   above rather than replacing any of it:
   - **Count-up.** `NumericReadout`'s `countUp` prop animates the displayed
     integer from its previous value to a new one (~550ms, ease-out) instead
     of swapping the text. Opt-in, numeric-only, and only wired up at
     genuine reveal/change moments — Dashboard's due-count, module detail's
     due-count, the exam-results score. Deliberately **not** on the sprint
     drill's countdown, which also uses `size="hero"` but is already a live,
     continuously-changing readout — animating every per-second tick would
     be noise, not a reveal.
   - **Staggered list entrance.** `src/components/stagger-in.tsx`'s
     `StaggerIn` wraps one list row with Reanimated's `FadeInDown` and a
     small per-index delay (capped at 8 steps so a long list doesn't drag
     its last row in half a second late). Applied to Moduler's due/other
     groups, Dashboard's weak-areas list, and both exam screens' history/
     weak-areas lists — the app's genuine list surfaces, not every list.
   - **Header settle-in.** Each of the four tab screens' title fades + slides
     in slightly (`FadeInDown`, ~280ms) on top of the existing
     `slide_from_right`/`shift` screen transition, not instead of it.
     Because Expo Router tabs stay mounted after first visit, this plays
     once per screen per app session, not on every tab switch — a deliberate
     side effect of using React Native's own layout-animation `entering`
     prop rather than a custom re-triggering effect.

   All three drop to a hard cut under reduced motion — no "instant version"
   of the animation, the same `entering={reducedMotion ? undefined : ...}`
   pattern used everywhere else motion is optional in this app. Explicitly
   out of scope, on the user's own instruction: particle backgrounds, glow/
   neon effects, gradient-mesh backgrounds, magnetic/shiny buttons — none of
   that fits an instrument panel.

## Navigation structure

Four tabs (Översikt/Moduler/Prov/Inställningar) — each maps to a genuinely
distinct mode (plan today / browse everything / simulate the real exam /
configure), not a device to be collapsed further. The actual gap was track
switching: it lived only inside Settings with zero visibility elsewhere, a
real problem for anyone studying more than one certificate. Fixed with
`src/components/track-badge.tsx` — a small header pill on Dashboard/
Moduler/Prov (not on stack-pushed detail screens) that opens an inline
switcher via `UnfurlMenu`. Settings keeps its own full track section too;
this is additive, not a replacement.

Within screens, the same asymmetry principle extends past single numbers to
whole-screen composition: Moduler groups modules into "Att repetera idag"
(due-sorted, brass) vs. "Övriga moduler" (quiet) rather than a flat
numbered list; the exam mode screen makes Full simulering (the real exam
format) the elevated dominant card with Snabbprov demoted secondary.

## Rules

- One thing per screen; drill screens show the question, the input, nothing else.
- Dark mode is the default; light mode changes colors only, never layout.
- Generous spacing, careful alignment, no decorative flourishes.
- Before a screen is "done", ask: *does this look assembled from a component
  library's defaults, or designed for this subject?* If the former, revise.

### `UnfurlMenu` — measure off-screen, not inside the animated container

`src/components/unfurl-menu.tsx` animates height+opacity between 0 and a
measured content height. The first real usage of it (the track-badge
switcher) revealed a real device bug: measuring the content via `onLayout`
*inside* the component's own animated 0-height/`overflow: hidden` container
never reported a real height on this RN/Fabric setup, so it silently never
opened. Fixed by measuring an invisible, absolutely-positioned clone of the
content instead — outside normal flow, so its layout is never constrained
by the animated wrapper's current height. Any future `UnfurlMenu` usage
inherits the fix already; noted here so the failure mode (chevron flips,
nothing visibly opens) isn't mistaken for something new.
