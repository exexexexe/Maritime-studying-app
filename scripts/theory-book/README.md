# Theory book generator

Compiles the app's own content into `docs/theory-book.pdf` — a reference
book with real chapters, a page-numbered table of contents, and navigable
PDF bookmarks. This is a reusable pipeline, not a one-off document: rerun
it any time content changes, especially as more items get marked
`authorReviewed: true` in `content/`.

## Setup

```bash
pip install --break-system-packages -r scripts/theory-book/requirements.txt
```

(macOS ships Python as an "externally managed" environment — the
`--break-system-packages` flag is required to install into it directly.
Use a venv instead if you'd rather not touch the system environment.)

## Usage

```bash
# informational only — no gate, just a preview of how draft-heavy the
# book will be
npm run theory-book:coverage

# generate docs/theory-book.pdf and verify its bookmarks with pypdf
npm run generate:theory-book
```

`docs/theory-book.pdf` is generated output, not checked into git (see
"Why the PDF isn't committed" below) — run the command above to produce
your own copy.

## How a section's draft/reviewed status is decided

Every topic's `authorReviewed` ratio (reviewed items ÷ total items in
that topic) is computed fresh on every run. At ≥90% (`DRAFT_THRESHOLD` in
`generate_book.py`) a topic renders with a quiet "Granskat." note; below
that it gets a loud orange callout box ("OGRANSKAT UTKAST — verifiera mot
kursmaterial innan du litar på detta avsnitt") right under the heading.
Chapter titles get the same ⚠ marker, computed over all of that module's
items. The same marker text drives both the visual table of contents and
the PDF's sidebar outline, so status is visible in both places without
extra bookkeeping.

This is the whole feedback loop: mark items reviewed in `content/`, rerun
`npm run generate:theory-book`, and the relevant sections' markers update
automatically. Nothing about draft status is configured by hand anywhere
in this pipeline. Today every module is at 0% reviewed, so the entire
book currently carries the warning — that's expected, not a bug, and
verified in `verify_bookmarks.py`'s output.

## Content synthesis: two chapters are prose, nine are structured extracts

The task behind this pipeline asked for the content to "read like an
actual textbook chapter." That's genuinely true for two chapters —
**Lanternor** (`prose/lanterns.py`) and **Utmärkning & bojar**
(`prose/buoyage.py`) — which are hand-authored: real paragraphs, grouped
by concept, with transitions between ideas, grounded in the app's actual
`explanationSv` facts but freshly written rather than copied. Lanterns
and Buoyage were picked because they're also the two diagram-heaviest
modules (see below).

The other nine modules go through `synth.py`, a mechanical fallback:
explanations are deduplicated, grouped into ~3-sentence paragraphs per
topic, and joined with a small rotating set of connective phrases. It's a
genuine step up from a raw question/answer list and it's organized by
topic, but it is not hand-polished prose — say so plainly if asked, don't
oversell it. Extending hand-authored prose to more modules later is a
matter of adding another `prose/<module>.py` with a `TOPICS` dict in the
same shape; `generate_book.py` picks it up automatically via
`PROSE_MODULES`.

## Diagrams

The app renders lantern, buoy, and stability diagrams natively from JSON
scene data (`payload.scene` on `lantern`/`buoy`/`stability_diagram`
items) — there's no existing static image to reuse, and screenshotting
the running app would mean chasing device chrome, dark/light mode, and
scroll position instead of controlling the pixels directly. Instead,
`diagrams.py` re-implements the same geometry and colors as the three
source React Native components
(`src/components/lantern-diagram.tsx`, `buoy-diagram.tsx`,
`stability-diagram.tsx`) directly in Pillow (PIL), rendering at 4×
supersample and downsampling with Lanczos filtering for anti-aliasing.

Pillow was chosen over a Node/SVG renderer specifically because the rest
of this pipeline is already Python (reportlab is Python-only) — one
dependency list, one `pip install`, no subprocess bridge between two
language runtimes for a single step.

All three diagram types made it in — lantern, buoy, and stability — not
just the two the task flagged as highest priority. Lanterns and Buoyage
get the most figures because they're referenced explicitly from the
hand-authored prose; the mechanical synthesis path also embeds up to
three diagram figures per topic wherever a topic's items carry
`payload.scene` (see `synth.py`'s `_figure_candidates`), so stability
diagrams end up illustrated too even without hand-authored prose for
that module.

## Bookmarks

Reportlab's Platypus framework doesn't produce a real PDF outline by
default — `pdf_builder.py`'s `BookDocTemplate.afterFlowable()` hook is
what turns each chapter/topic heading into an actual
`canvas.bookmarkPage()` + `canvas.addOutlineEntry()` call, alongside
feeding the same heading into the visual `TableOfContents` flowable via
`doc.multiBuild()`. `verify_bookmarks.py` reads the finished PDF back
with `pypdf` and walks `reader.outline` to confirm the structure is
actually there — the generation code isn't trusted on its own.

## Why the PDF isn't committed

`.gitignore` already treats generated/native build output as something
to regenerate rather than commit (`/ios`, `/android`, `dist/`, `.expo/`,
etc.). `docs/theory-book.pdf` follows the same convention — it's ignored,
and `npm run generate:theory-book` is the documented way to produce a
current copy on demand. A committed PDF would also go stale immediately
as content review progresses, which defeats the point of this being a
living, rerunnable pipeline rather than a snapshot.

## English version (not built yet)

v1 is Swedish-only, sourced from `explanationSv`. The loader
(`content_loader.Item`) already carries `explanationEn`-equivalent data
on the raw item where present; an English rerun means swapping the text
source used in `synth.py` and adding `prose/lanterns_en.py` /
`prose/buoyage_en.py` counterparts, not restructuring the pipeline.

## Files

- `content_loader.py` — shared content loading (mirrors `check-content.js`'s traversal)
- `coverage_report.py` — Step 1: per-module reviewed/total counts (informational)
- `diagrams.py` — Pillow renderers for lantern/buoy/stability figures
- `synth.py` — mechanical prose synthesis for non-flagship modules
- `prose/lanterns.py`, `prose/buoyage.py` — hand-authored flagship chapters
- `pdf_builder.py` — reportlab styles, fonts, bookmark mechanism, flowable helpers
- `generate_book.py` — orchestrates everything above into `docs/theory-book.pdf`
- `verify_bookmarks.py` — reads the PDF back and confirms the outline is real
