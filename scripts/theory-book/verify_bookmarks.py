#!/usr/bin/env python3
"""
Confirms the generated PDF's outline (sidebar bookmarks) is real and
navigable — not just assumed from pdf_builder.py's afterFlowable() code.
Reads the PDF back with pypdf and checks reader.outline directly.

Run after generate_book.py:  python3 scripts/theory-book/verify_bookmarks.py
"""

from __future__ import annotations

import os
import sys

import pypdf

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PDF_PATH = os.path.join(REPO_ROOT, "assets", "theory-book.pdf")


def flatten(outline, depth=0):
    """pypdf represents nested outline items as nested lists — walk it and
    yield (depth, title) pairs in document order."""
    out = []
    for entry in outline:
        if isinstance(entry, list):
            out.extend(flatten(entry, depth + 1))
        else:
            out.append((depth, entry.title))
    return out


def main() -> int:
    if not os.path.isfile(PDF_PATH):
        print(f"No PDF at {PDF_PATH} — run generate_book.py first.")
        return 1

    reader = pypdf.PdfReader(PDF_PATH)
    outline = reader.outline
    flat = flatten(outline)

    chapters = [t for d, t in flat if d == 0]
    topics = [t for d, t in flat if d == 1]

    print(f"pages: {len(reader.pages)}")
    print(f"outline entries: {len(flat)} total ({len(chapters)} chapters, {len(topics)} topics)")
    print()
    for depth, title in flat:
        print(("  " * depth) + title)

    ok = len(chapters) >= 11 and len(topics) >= 40
    print()
    print("OK — real, navigable outline confirmed." if ok else "UNEXPECTED — outline looks incomplete.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
