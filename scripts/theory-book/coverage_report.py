"""
Step 1 — coverage check. Run this before generating the book.

Not a gate (the book includes every item regardless of review status) —
this just tells you, per module, how much of the generated book will
carry the "unreviewed draft" banner versus read as settled, so there are
no surprises about how draft-heavy the first version is.

Run: python3 scripts/theory-book/coverage_report.py
"""

from __future__ import annotations

from content_loader import load_content, review_ratio


def main() -> None:
    cs = load_content()

    print(f"{'Module':<28} {'Reviewed':>9} {'Total':>7} {'%':>6}")
    print("-" * 54)

    total_items = 0
    total_reviewed = 0

    for m in cs.modules:
        topic_ids = {t.id for t in cs.topics_for_module(m.id)}
        items = [i for i in cs.items if i.topic_id in topic_ids]
        reviewed = sum(1 for i in items if i.author_reviewed)
        pct = review_ratio(items) * 100
        total_items += len(items)
        total_reviewed += reviewed
        print(f"{m.title_sv:<28} {reviewed:>9} {len(items):>7} {pct:>5.1f}%")

    print("-" * 54)
    overall_pct = (total_reviewed / total_items * 100) if total_items else 0.0
    print(f"{'TOTAL':<28} {total_reviewed:>9} {total_items:>7} {overall_pct:>5.1f}%")

    print()
    print(
        "This is not a gate — every item is included in the generated book "
        "regardless of review status. Sections below the draft threshold "
        "get a visible 'unreviewed draft' banner; see generate_book.py's "
        "DRAFT_THRESHOLD."
    )


if __name__ == "__main__":
    main()
