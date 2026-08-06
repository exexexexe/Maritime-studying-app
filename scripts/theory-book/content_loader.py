"""
Loads Plugga Sjöexamen's bundled content JSON the same way check-content.js
does — a plain recursive walk of content/, skipping modules.json/exams.json
— so this stays correct without depending on (or duplicating) the
TypeScript content registry in src/content/index.ts.

This is the single shared data source for every theory-book script:
coverage_report.py, diagrams.py's callers, and generate_book.py all import
from here rather than re-reading JSON themselves.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CONTENT_DIR = os.path.join(REPO_ROOT, "content")


@dataclass
class Module:
    id: str
    slug: str
    title_sv: str
    title_en: str
    order: int


@dataclass
class Topic:
    id: str
    module_id: str
    slug: str
    title_sv: str
    title_en: str


@dataclass
class Item:
    id: str
    topic_id: str
    type: str
    tracks: list
    author_reviewed: bool
    explanation_sv: str
    payload: dict = field(default_factory=dict)
    # Full original JSON object — term_card/radio_procedure/map_question
    # keep their type-specific text on top-level fields (termSv, scenario,
    # instructions, ...) rather than in payload; callers that need those
    # read them from here rather than the dataclass growing a field per
    # item type.
    raw: dict = field(default_factory=dict)


@dataclass
class ContentSet:
    modules: list  # list[Module], sorted by order
    topics: list  # list[Topic]
    items: list  # list[Item]

    def topics_for_module(self, module_id: str) -> list:
        return [t for t in self.topics if t.module_id == module_id]

    def items_for_topic(self, topic_id: str) -> list:
        return [i for i in self.items if i.topic_id == topic_id]


def _topic_files() -> list:
    files = []
    for root, _dirs, names in os.walk(CONTENT_DIR):
        for name in names:
            if not name.endswith(".json"):
                continue
            if name in ("modules.json", "exams.json"):
                continue
            files.append(os.path.join(root, name))
    return sorted(files)


def load_content() -> ContentSet:
    with open(os.path.join(CONTENT_DIR, "modules.json"), encoding="utf-8") as f:
        model = json.load(f)

    modules = sorted(
        (
            Module(
                id=m["id"],
                slug=m["slug"],
                title_sv=m["titleSv"],
                title_en=m["titleEn"],
                order=m["order"],
            )
            for m in model["modules"]
        ),
        key=lambda m: m.order,
    )
    topics = [
        Topic(
            id=t["id"],
            module_id=t["moduleId"],
            slug=t["slug"],
            title_sv=t["titleSv"],
            title_en=t["titleEn"],
        )
        for t in model["topics"]
    ]

    items = []
    for path in _topic_files():
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        for it in data.get("items", []):
            items.append(
                Item(
                    id=it["id"],
                    topic_id=it["topicId"],
                    type=it["type"],
                    tracks=it.get("tracks", []),
                    author_reviewed=bool(it.get("authorReviewed", False)),
                    explanation_sv=it.get("explanationSv", "") or "",
                    payload=it.get("payload") or {},
                    raw=it,
                )
            )

    return ContentSet(modules=modules, topics=topics, items=items)


def review_ratio(items: list) -> float:
    if not items:
        return 1.0  # an empty section has nothing unreviewed to warn about
    reviewed = sum(1 for i in items if i.author_reviewed)
    return reviewed / len(items)


if __name__ == "__main__":
    cs = load_content()
    print(f"{len(cs.modules)} modules, {len(cs.topics)} topics, {len(cs.items)} items")
