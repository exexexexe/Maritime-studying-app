"""
Mechanical synthesis for every module that doesn't have a hand-authored
prose/*.py chapter (see prose/lanterns.py's docstring for the flagship-
chapter alternative and README.md for which modules get which
treatment).

This groups each topic's item explanations into short paragraphs under
the topic heading — organized by topic, deduplicated, lightly connected
— which is a genuine step up from a raw question/answer list, but it is
NOT hand-polished narrative prose the way the two flagship chapters are.
Regenerating the book never rewrites this text; it only recomputes which
sections carry the draft banner as authorReviewed status changes (see
generate_book.py).
"""

from __future__ import annotations

SENTENCES_PER_PARAGRAPH = 3
MAX_FIGURES_PER_TOPIC = 3

_CONNECTIVES = [
    "",
    "Vidare gäller att ",
    "Det är också värt att notera att ",
    "I samma ämne: ",
    "Utöver det: ",
    "Slutligen: ",
]


def _lowercase_first(s: str) -> str:
    return s[:1].lower() + s[1:] if s else s


def _text_for_item(item) -> str:
    text = (item.explanation_sv or "").strip()
    if not text:
        return ""
    if item.type == "term_card":
        term = item.raw.get("termSv")
        if term:
            return f"{term} — {text}"
    return text


def _dedupe(texts):
    seen = set()
    out = []
    for t in texts:
        key = t.strip()
        if key and key not in seen:
            seen.add(key)
            out.append(key)
    return out


def _figure_candidates(items):
    out = []
    for it in items:
        if it.type in ("lantern", "buoy", "stability_diagram"):
            scene = it.payload.get("scene")
            if scene:
                out.append((it, scene))
    return out[:MAX_FIGURES_PER_TOPIC]


def synthesize_topic(items):
    """Returns a list of blocks: ('p', text) | ('figure', item, scene)."""
    explanations = _dedupe(_text_for_item(it) for it in items)
    blocks = []

    for i in range(0, len(explanations), SENTENCES_PER_PARAGRAPH):
        group = explanations[i : i + SENTENCES_PER_PARAGRAPH]
        sentences = []
        for j, sentence in enumerate(group):
            connective = _CONNECTIVES[(i // SENTENCES_PER_PARAGRAPH + j) % len(_CONNECTIVES)]
            if connective:
                sentence = connective + _lowercase_first(sentence)
            sentences.append(sentence)
        blocks.append(("p", " ".join(sentences)))

    for it, scene in _figure_candidates(items):
        caption = scene.get("captionSv") or it.id
        blocks.append(("figure", it.id, caption))

    return blocks
