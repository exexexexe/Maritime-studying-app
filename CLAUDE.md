# Plugga Sjöexamen — project guide

Native (Expo + React Native + TypeScript) study app for Swedish maritime exams.
Primary track: Fartygsbefäl klass 8. Fully offline; no backend, no accounts.

## Process discipline (non-negotiable)

- Commit after every meaningful chunk of work — a working module, engine, or
  screen each gets its own commit. Push regularly; the previous build of this
  app was lost to unpushed work.
- Work strictly phase by phase (see the build-phase task list); do not start
  phase N+1 before phase N is committed and usable.

## Architecture rules

- All persistence goes through `src/db/` — screens never touch SQLite directly.
  This is the seam for a future sync backend.
- Design tokens are law: colors from `src/theme/colors.js` via semantic Tailwind
  utilities, type scale and font utilities from `tailwind.config.js`. No raw
  hexes or ad hoc font sizes in components. See DESIGN.md for the full system
  and the self-critique bar every screen must pass.
- Content is bundled JSON under `content/`, one file per topic, validated by a
  script. Answer options carry `isCorrect` per option — never index-0-correct;
  options are shuffled on render, seeded per attempt.
- State management is React Context + hooks. No Redux/Zustand.
- Nothing may depend on a network connection at runtime.

## Commands

- `npm run typecheck` — must pass before every commit
- `npm run check:tokens` — colors.js/global.css drift guard
- `npm start` — dev server

## Product framing

Independent study aid — always "helps you prepare for", never "certified for".
Not affiliated with Transportstyrelsen, NFB, or any certifying body. UI language
is Swedish.
