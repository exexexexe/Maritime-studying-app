# Design Philosophy: Rhythm as Language

Companion to [DESIGN.md](DESIGN.md) — defines the identity layer built
during the UI rework. Not a reference to other apps' aesthetics; derived
entirely from the app's own subject matter.

## The core idea

Maritime light characteristics are defined by the relationship between
on-time and off-time: Fl (short pulse, long silence), Iso (perfectly even),
Oc (mostly present, briefly absent), Q/VQ (rapid, urgent), Fl(2) (grouped,
countable). This is already the app's core teaching content. The rework
treats this vocabulary as the app's own motion language — not decoration
added on top of features, but the same system used twice: to teach real
light characteristics, and to *be* the app's visual heartbeat.

## Mappings

Defined as data in `src/lib/rhythm-map.ts` (`RHYTHM`), played back via the
`useRhythm(characteristic, { loop, enabled })` hook in `src/lib/rhythm.ts`.

| App state | `RHYTHM` key | Characteristic | Why | Wired up? |
|---|---|---|---|---|
| Exam time running low | `urgent` | `Q` | Genuine urgency, same as its real-world meaning | **Yes** — sprint drill's final 10s countdown (`src/app/sprint/lantern.tsx`) |
| Correct answer | `correct` | `Iso 1.2s` | Confidence without drama | Not yet — defined, not applied to any answer-feedback moment |
| Needs-review / wrong answer flag | `needsReview` | `Oc 2s` | Present, flags attention, not alarming | Not yet |
| Streak / steady progress | `streak` | `Fl 3s` | Alive without being distracting | Not yet — no streak-tracking UI exists yet |
| Loading / processing state | `loading` | `Fl(2) 3.5s` | Distinctive, calm, designed to be watched and counted | Not yet — app has no loading state long enough to need one (all content is bundled, offline) |

Only `urgent` had a real UI moment to attach to during this rework (the
sprint drill's countdown). The rest are defined and covered by
`rhythm.test.ts` but not yet wired into a screen — extending coverage means
picking a real trigger, not inventing decoration to justify the mapping.

## The governing constraint

**Motion must always be legible, never merely decorative.** Every animated
moment in the UI should be traceable to an actual characteristic with an
actual meaning. If a rhythm can't be justified this way, it doesn't belong —
this is what keeps the identity disciplined (instrument-panel restraint)
even while being genuinely original (nobody else has this vocabulary to draw
from).

## Technical note — status as of 2026-08-05

One system, reused across two layers, not a second animation framework:

- **Content layer** (pre-existing). `src/lantern/characteristics.ts` parses
  standard notation (F, Fl, LFl, Q, VQ, IQ, Iso, Oc, Mo — with groups,
  composite groups, and IALA cardinal-mark standard periods) into a timed
  on/off segment sequence; `src/components/animated-light.tsx` plays it back
  via Reanimated, snapping instantly between states (real lights don't
  fade) and respecting `useReducedMotion` — under reduced motion it renders
  statically lit, and `LanternDiagram` falls back to printing the notation
  as text so the meaning survives (suppressed while the animation is
  actually playing on "identify this characteristic" items, so it doesn't
  hand over the answer). Piloted on all 20 light-characteristic items in
  Fyrar och ljuskaraktärer.
- **UI-chrome layer** (built in the rework). `src/lib/rhythm-map.ts` holds
  the `RHYTHM` mapping as plain testable data (no Reanimated import);
  `src/lib/rhythm.ts`'s `useRhythm(characteristic, { loop, enabled })` hook
  reuses the same `parseCharacteristic` + `withRepeat`/`withSequence`/
  `Easing.steps(1)` playback as `AnimatedLight`, returning a shared value
  any component can drive `useAnimatedStyle` off. `enabled: false` settles
  the value at rest rather than unmounting, and reduced motion is handled
  inside the hook itself (settles instantly, never plays the sequence) —
  see the mapping table above for what's actually wired up vs. still just
  defined.

**Not yet done:** applying blink rhythms to lateral/cardinal marks in
`BuoyDiagram` (currently static day shapes only) — unstarted, out of scope
for this rework.

## Open questions

- Extending `RHYTHM` coverage (correct/needsReview/streak/loading) to real
  triggers as those UI moments get built, rather than retrofitting
  decoration to justify an unused mapping.
- Whether this extends to sound (a very quiet, optional audio cue on major
  state changes, echoing real fog-signal timing) — bigger scope, still just
  a maybe, not default-yes.
- Reduced-motion handling is done at the hook level (`useRhythm`) and the
  `AnimatedLight` level independently — if a third rhythm-driven surface
  appears, confirm it also renders a static/textual equivalent, since the
  hook only owns the motion, never the sole carrier of meaning.
