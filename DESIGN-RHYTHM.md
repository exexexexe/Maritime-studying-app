# Design Philosophy: Rhythm as Language

Companion to [DESIGN.md](DESIGN.md) — defines the identity layer proposed
for the eventual UI rework. Not a reference to other apps' aesthetics;
derived entirely from the app's own subject matter. **Not yet implemented —
this is a philosophy document, not a spec to build against as-is.**

## The core idea

Maritime light characteristics are defined by the relationship between
on-time and off-time: Fl (short pulse, long silence), Iso (perfectly even),
Oc (mostly present, briefly absent), Q/VQ (rapid, urgent), Fl(2) (grouped,
countable). This is already the app's core teaching content. The rework
treats this vocabulary as the app's own motion language — not decoration
added on top of features, but the same system used twice: to teach real
light characteristics, and to *be* the app's visual heartbeat.

## Proposed mappings (starting point, not final)

| App state | Characteristic borrowed | Why |
|---|---|---|
| Correct answer | Iso (even, settled) | Confidence without drama |
| Needs-review / wrong answer flag | Oc (mostly steady, brief interruption) | Present, flags attention, not alarming |
| Exam time running low / review backlog | Q or VQ (rapid, insistent) | Genuine urgency, same as its real-world meaning |
| Streak / steady progress | Slow Fl (single confident pulse) | Alive without being distracting |
| Loading / processing state | Fl(2) group-flash | Distinctive, calm, designed to be watched and counted |

## The governing constraint

**Motion must always be legible, never merely decorative.** Every animated
moment in the UI should be traceable to an actual characteristic with an
actual meaning. If a rhythm can't be justified this way, it doesn't belong —
this is what keeps the identity disciplined (instrument-panel restraint)
even while being genuinely original (nobody else has this vocabulary to draw
from).

## Technical note — status as of 2026-08-04

This is meant to generalize a shared `AnimatedLight` / characteristic-spec
system across the Lanterns/Buoyage animation work *and* UI chrome — one
system, reused, not a second animation framework or a new dependency.

**That underlying system does not exist yet.** The animated light
characteristics feature is still [IDEAS.md](IDEAS.md) item 1, unstarted.
Building this design language for real means building that foundation
first (or alongside it) — there's nothing to "generalize" yet.

## Open questions for the rework prompt

- Which specific states in the actual app map to which characteristic —
  the table above is a starting proposal, not a locked spec.
- Whether this extends to sound (a very quiet, optional audio cue on major
  state changes, echoing real fog-signal timing) — bigger scope, flag as
  a maybe, not default-yes.
- How this interacts with reduced-motion accessibility settings — real
  characteristics can still be represented statically/instantly for users
  who need reduced motion; the meaning should survive even if the pulse
  doesn't.
