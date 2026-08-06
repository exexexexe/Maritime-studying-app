#!/usr/bin/env python3
"""
Generates the theory book PDF from the app's bundled content.

Run:  python3 scripts/theory-book/generate_book.py
  or: npm run generate:theory-book

Regenerate any time — nothing here is a one-shot artifact. As more items
get marked authorReviewed: true in the app's content JSON, rerunning this
script recomputes each section's draft/reviewed status from scratch and
produces an updated PDF; nothing needs to be reconfigured by hand. See
README.md for the full design (why Python/reportlab, why two chapters
get hand-authored prose and the rest get mechanical synthesis, why the
PDF itself isn't committed).
"""

from __future__ import annotations

import datetime
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib.units import mm
from reportlab.platypus import KeepTogether, NextPageTemplate, PageBreak, Paragraph, Spacer

import synth
from content_loader import load_content, review_ratio
from diagrams import render_buoy, render_lantern, render_stability
from pdf_builder import (
    DRAFT_MARK,
    bookmarked,
    build_document,
    draft_banner,
    esc,
    figure_flowable,
    get_styles,
    reviewed_note,
    toc_flowable,
)
from prose import buoyage as prose_buoyage
from prose import lanterns as prose_lanterns

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUTPUT_PATH = os.path.join(REPO_ROOT, "docs", "theory-book.pdf")
RENDER_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_render_cache")

# A topic reads as settled ("granskat", quiet marker) only once nearly all
# of its items are authorReviewed; otherwise it gets the loud draft
# banner. 0.9 rather than 1.0 so one stray unreviewed item authored later
# alongside an otherwise-finished topic doesn't re-trigger the full
# warning — tune this if that judgment call doesn't feel right once real
# review data exists.
DRAFT_THRESHOLD = 0.9

PROSE_MODULES = {
    "mod-lanterns": prose_lanterns,
    "mod-buoyage": prose_buoyage,
}


def topic_status(items) -> tuple:
    ratio = review_ratio(items)
    return ("reviewed" if ratio >= DRAFT_THRESHOLD else "draft"), ratio


def render_figure(item) -> str | None:
    scene = item.payload.get("scene")
    if not scene:
        return None
    path = os.path.join(RENDER_CACHE, f"{item.id}.png")
    try:
        if item.type == "lantern":
            img = render_lantern(scene)
        elif item.type == "buoy":
            img = render_buoy(scene)
        elif item.type == "stability_diagram":
            img = render_stability(scene)
        else:
            return None
    except Exception as e:  # noqa: BLE001 — a bad scene shouldn't kill the whole build
        print(f"  ! could not render figure for {item.id}: {e}")
        return None
    img.save(path)
    return path


def add_figure(story: list, item, caption: str) -> None:
    path = render_figure(item)
    if not path:
        return
    story.append(Spacer(1, 2 * mm))
    story.append(KeepTogether(figure_flowable(path, caption)))


def build_cover(story: list, cs) -> None:
    styles = get_styles()
    total = len(cs.items)
    reviewed = sum(1 for i in cs.items if i.author_reviewed)
    pct = (reviewed / total * 100) if total else 0.0

    story.append(Spacer(1, 48 * mm))
    story.append(Paragraph("Teoriboken", styles["CoverTitle"]))
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            "Plugga Sjöexamen — sammanställd referens för Fartygsbefäl klass 8",
            styles["CoverSubtitle"],
        )
    )
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(f"Genererad {datetime.date.today().isoformat()}", styles["CoverMeta"]))
    story.append(Spacer(1, 1 * mm))
    story.append(
        Paragraph(
            f"{reviewed} av {total} innehållspunkter granskade ({pct:.1f} %)",
            styles["CoverMeta"],
        )
    )
    story.append(Spacer(1, 28 * mm))
    story.append(
        Paragraph(
            "Fristående studiehjälpmedel som hjälper dig att förbereda dig inför prov. Inte "
            "anslutet till eller godkänt av Transportstyrelsen, NFB eller något annat "
            "certifierande organ. Ogranskade avsnitt är tydligt markerade nedan — verifiera "
            "dem mot kursmaterial innan du litar på dem.",
            styles["CoverDisclaimer"],
        )
    )
    story.append(NextPageTemplate("Body"))
    story.append(PageBreak())


def build_toc(story: list) -> None:
    styles = get_styles()
    story.append(Paragraph("Innehåll", styles["TOCHeading"]))
    story.append(toc_flowable())
    story.append(PageBreak())


def build_chapters(story: list, cs) -> dict:
    """Returns a small stats dict used only for the closing console
    report — the PDF itself doesn't depend on this."""
    styles = get_styles()
    stats = {"draft_sections": 0, "reviewed_sections": 0, "chapters": []}
    all_items_by_id = {i.id: i for i in cs.items}

    for m in cs.modules:
        topics = cs.topics_for_module(m.id)
        topic_ids = {t.id for t in topics}
        module_items = [i for i in cs.items if i.topic_id in topic_ids]
        if not module_items:
            continue

        status, ratio = topic_status(module_items)
        marker = f"{DRAFT_MARK} " if status == "draft" else ""
        chapter_title = f"{marker}{m.title_sv}"
        stats["chapters"].append((m.title_sv, status, ratio))

        story.append(PageBreak())
        heading = Paragraph(esc(chapter_title), styles["ChapterHeading"])
        story.append(bookmarked(heading, 0, f"mod-{m.id}", chapter_title))
        story.append(
            Paragraph(
                f"{sum(1 for i in module_items if i.author_reviewed)} av {len(module_items)} "
                f"punkter granskade ({ratio * 100:.0f} %).",
                styles["ChapterSubtitle"],
            )
        )

        prose_module = PROSE_MODULES.get(m.id)
        if prose_module is not None:
            intro = getattr(prose_module, "CHAPTER_INTRO", None)
            if intro:
                story.append(Paragraph(esc(intro), styles["Body"]))
                story.append(Spacer(1, 2 * mm))

        for t in topics:
            items = cs.items_for_topic(t.id)
            if not items:
                continue

            t_status, t_ratio = topic_status(items)
            if t_status == "draft":
                stats["draft_sections"] += 1
            else:
                stats["reviewed_sections"] += 1

            t_marker = f"{DRAFT_MARK} " if t_status == "draft" else ""
            topic_title = f"{t_marker}{t.title_sv}"

            topic_heading = Paragraph(esc(topic_title), styles["TopicHeading"])
            story.append(bookmarked(topic_heading, 1, f"top-{t.id}", topic_title))

            if t_status == "draft":
                story.append(draft_banner())
                story.append(Spacer(1, 2 * mm))
            else:
                story.append(reviewed_note())

            if prose_module is not None and t.id in prose_module.TOPICS:
                blocks = prose_module.TOPICS[t.id]
            else:
                blocks = synth.synthesize_topic(items)

            for block in blocks:
                if block[0] == "p":
                    story.append(Paragraph(esc(block[1]), styles["Body"]))
                elif block[0] == "figure":
                    item_id, caption = block[1], block[2]
                    # Hand-authored prose may illustrate a topic with a figure
                    # drawn from elsewhere in the same chapter (e.g. the
                    # picture-ID topics under Buoyage) — look up across the
                    # whole content set, not just this topic's own items.
                    item = all_items_by_id.get(item_id)
                    if item is None:
                        print(f"  ! figure references unknown item id: {item_id}")
                        continue
                    add_figure(story, item, caption or item_id)

    return stats


def main() -> None:
    print("Loading content…")
    cs = load_content()

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    if os.path.isdir(RENDER_CACHE):
        shutil.rmtree(RENDER_CACHE)
    os.makedirs(RENDER_CACHE, exist_ok=True)

    print("Building document…")
    story: list = []
    build_cover(story, cs)
    build_toc(story)
    stats = build_chapters(story, cs)

    doc = build_document(OUTPUT_PATH)
    doc.multiBuild(story)

    shutil.rmtree(RENDER_CACHE, ignore_errors=True)

    print(f"\nWrote {OUTPUT_PATH}")
    print(f"Sections: {stats['draft_sections']} draft, {stats['reviewed_sections']} reviewed")
    for title, status, ratio in stats["chapters"]:
        flag = "DRAFT" if status == "draft" else "reviewed"
        print(f"  [{flag:8s}] {title} ({ratio * 100:.0f}%)")


if __name__ == "__main__":
    main()
