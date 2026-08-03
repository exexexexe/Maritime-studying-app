# Plugga Sjöexamen — Design System

The bar: **simple, clean, elite** — a well-made instrument, not a startup dashboard.
Reference material: admiralty chart typography, ECDIS displays, dive computers,
Bremont watch faces.

## Color tokens

Single source of truth: `src/theme/colors.js` (mirrored as CSS variables in
`src/global.css`; `npm run check:tokens` guards against drift). Semantic names,
used via Tailwind utilities (`bg-bg`, `text-ink`, `border-fog/15`) — never raw
hexes in components.

| Token | Dark (default) | Light | Role |
|---|---|---|---|
| `bg` | `#0B141D` deep-sea navy | `#F1EBDD` chart paper | app background |
| `surface` | `#13222F` charted water | `#FAF6EB` fresh paper | cards, raised surfaces |
| `ink` | `#E9E2D0` chart paper | `#182634` chart ink | primary text |
| `fog` | `#8B9DA9` | `#5A6C79` | secondary text, hairlines |
| `brass` | `#C9A45C` | `#8A6D2F` | the one accent |
| `starboard` | `#3FA372` | `#1F7A4D` | correct / go |
| `port` | `#C65D4E` | `#A63E30` | incorrect / stop |

Deliberately avoided: warm-cream + terracotta, black + neon green, and any
component-library default palette.

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

## Rules

- One thing per screen; drill screens show the question, the input, nothing else.
- Dark mode is the default; light mode changes colors only, never layout.
- Generous spacing, careful alignment, no decorative flourishes.
- Before a screen is "done", ask: *does this look assembled from a component
  library's defaults, or designed for this subject?* If the former, revise.
