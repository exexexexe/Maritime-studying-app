"""
reportlab Platypus document assembly: styles, the custom DocTemplate that
emits real PDF outline entries (bookmarks) alongside a page-numbered
visual table of contents, and the flowable builders every chapter is
made from.

Bookmarks: reportlab's BaseDocTemplate.afterFlowable() hook is the
standard way to turn Platypus headings into a real navigable outline —
see BookDocTemplate below. This is verified after generation by reading
the PDF back with pypdf (see verify_bookmarks.py) rather than assumed
from the code.
"""

from __future__ import annotations

import os
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image as RLImage,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

PAGE_W, PAGE_H = A4
MARGIN = 22 * mm

# --------------------------------------------------------------------------
# Fonts — Georgia for a considered, book-like serif; falls back to
# reportlab's built-in Times-Roman if the system font isn't found (e.g. a
# non-macOS CI runner), so the script still produces a PDF everywhere.
# --------------------------------------------------------------------------

_FONT_DIR = "/System/Library/Fonts/Supplemental"
_FONT_FAMILY = "Georgia"
_BODY_FONT = "Georgia"
_BODY_BOLD = "Georgia-Bold"
_BODY_ITALIC = "Georgia-Italic"
_BODY_BOLD_ITALIC = "Georgia-BoldItalic"


def _register_fonts() -> None:
    global _BODY_FONT, _BODY_BOLD, _BODY_ITALIC, _BODY_BOLD_ITALIC
    try:
        pdfmetrics.registerFont(TTFont("Georgia", os.path.join(_FONT_DIR, "Georgia.ttf")))
        pdfmetrics.registerFont(TTFont("Georgia-Bold", os.path.join(_FONT_DIR, "Georgia Bold.ttf")))
        pdfmetrics.registerFont(TTFont("Georgia-Italic", os.path.join(_FONT_DIR, "Georgia Italic.ttf")))
        pdfmetrics.registerFont(
            TTFont("Georgia-BoldItalic", os.path.join(_FONT_DIR, "Georgia Bold Italic.ttf"))
        )
        pdfmetrics.registerFontFamily(
            "Georgia",
            normal="Georgia",
            bold="Georgia-Bold",
            italic="Georgia-Italic",
            boldItalic="Georgia-BoldItalic",
        )
    except Exception:
        _BODY_FONT, _BODY_BOLD, _BODY_ITALIC, _BODY_BOLD_ITALIC = (
            "Times-Roman",
            "Times-Bold",
            "Times-Italic",
            "Times-BoldItalic",
        )


_register_fonts()

# --------------------------------------------------------------------------
# Colors — content colors, not the app's UI tokens (different medium; see
# README.md). A warm, restrained palette that still reads as "book," plus
# a genuinely loud draft-warning color per the task's own instruction.
# --------------------------------------------------------------------------

INK = colors.HexColor("#20241F")
MUTED = colors.HexColor("#5B6660")
RULE = colors.HexColor("#C9C2B2")
DRAFT_BG = colors.HexColor("#FCEBC6")
DRAFT_BORDER = colors.HexColor("#B8460E")
DRAFT_TEXT = colors.HexColor("#7A2E08")
REVIEWED_TEXT = colors.HexColor("#3A6B4A")
FIGURE_CAPTION = colors.HexColor("#5B6660")

DRAFT_MARK = "⚠"  # ⚠


def get_styles() -> dict:
    ss = getSampleStyleSheet()
    styles = {}

    styles["CoverTitle"] = ParagraphStyle(
        "CoverTitle", fontName=_BODY_BOLD, fontSize=30, leading=36, alignment=TA_CENTER, textColor=INK
    )
    styles["CoverSubtitle"] = ParagraphStyle(
        "CoverSubtitle", fontName=_BODY_FONT, fontSize=15, leading=20, alignment=TA_CENTER, textColor=MUTED
    )
    styles["CoverMeta"] = ParagraphStyle(
        "CoverMeta", fontName=_BODY_FONT, fontSize=10, leading=14, alignment=TA_CENTER, textColor=MUTED
    )
    styles["CoverDisclaimer"] = ParagraphStyle(
        "CoverDisclaimer",
        fontName=_BODY_ITALIC,
        fontSize=9,
        leading=13,
        alignment=TA_CENTER,
        textColor=MUTED,
    )

    styles["TOCHeading"] = ParagraphStyle(
        "TOCHeading", fontName=_BODY_BOLD, fontSize=20, leading=26, textColor=INK, spaceAfter=10 * mm
    )
    styles["TOCEntryReviewed"] = ParagraphStyle(
        "TOCEntryReviewed", fontName=_BODY_FONT, fontSize=12, leading=16, textColor=INK
    )
    styles["TOCEntryDraft"] = ParagraphStyle(
        "TOCEntryDraft", fontName=_BODY_BOLD, fontSize=12, leading=16, textColor=DRAFT_TEXT
    )

    styles["ChapterHeading"] = ParagraphStyle(
        "ChapterHeading",
        fontName=_BODY_BOLD,
        fontSize=22,
        leading=28,
        textColor=INK,
        spaceBefore=0,
        spaceAfter=2 * mm,
    )
    styles["ChapterSubtitle"] = ParagraphStyle(
        "ChapterSubtitle", fontName=_BODY_ITALIC, fontSize=10.5, leading=14, textColor=MUTED, spaceAfter=6 * mm
    )
    styles["TopicHeading"] = ParagraphStyle(
        "TopicHeading",
        fontName=_BODY_BOLD,
        fontSize=14,
        leading=18,
        textColor=INK,
        spaceBefore=7 * mm,
        spaceAfter=2.5 * mm,
    )
    styles["Body"] = ParagraphStyle(
        "Body",
        fontName=_BODY_FONT,
        fontSize=10.5,
        leading=15.5,
        alignment=TA_JUSTIFY,
        textColor=INK,
        spaceAfter=3.2 * mm,
    )
    styles["DraftBanner"] = ParagraphStyle(
        "DraftBanner", fontName=_BODY_BOLD, fontSize=10, leading=13.5, textColor=DRAFT_TEXT
    )
    styles["ReviewedNote"] = ParagraphStyle(
        "ReviewedNote", fontName=_BODY_ITALIC, fontSize=8.5, leading=11, textColor=REVIEWED_TEXT, spaceAfter=2 * mm
    )
    styles["FigureCaption"] = ParagraphStyle(
        "FigureCaption",
        fontName=_BODY_ITALIC,
        fontSize=8.5,
        leading=11,
        alignment=TA_CENTER,
        textColor=FIGURE_CAPTION,
        spaceAfter=4 * mm,
    )
    styles["CoverageLine"] = ParagraphStyle(
        "CoverageLine", fontName=_BODY_FONT, fontSize=9, leading=12, textColor=MUTED
    )
    return styles


def esc(text: str) -> str:
    """Escape free text before handing it to a Paragraph — Paragraph
    bodies are mini-XML, and prose sourced from content JSON is not
    pre-escaped. Never build markup by interpolating raw content text."""
    return escape(text or "")


def bookmarked(paragraph: Paragraph, level: int, key: str, title: str) -> Paragraph:
    """Tags a Paragraph so BookDocTemplate.afterFlowable() turns it into a
    real PDF outline entry when it's drawn — see the class docstring."""
    paragraph._bookmark = (level, key, title)
    return paragraph


def draft_banner() -> Table:
    text = Paragraph(
        f"{DRAFT_MARK} OGRANSKAT UTKAST — verifiera mot kursmaterial innan du litar på detta avsnitt.",
        get_styles()["DraftBanner"],
    )
    t = Table([[text]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), DRAFT_BG),
                ("BOX", (0, 0), (-1, -1), 1.1, DRAFT_BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def reviewed_note() -> Paragraph:
    return Paragraph("Granskat.", get_styles()["ReviewedNote"])


def figure_flowable(image_path: str, caption: str, max_width_mm: float = 110) -> list:
    styles = get_styles()
    img = RLImage(image_path)
    max_w = max_width_mm * mm
    ratio = img.imageHeight / float(img.imageWidth)
    img.drawWidth = max_w
    img.drawHeight = max_w * ratio
    img.hAlign = "CENTER"
    return [img, Paragraph(esc(caption), styles["FigureCaption"])]


class BookDocTemplate(BaseDocTemplate):
    """Emits real PDF outline entries for every flowable tagged via
    bookmarked() above, and feeds the same headings into the document's
    TableOfContents flowable so the visual TOC page gets accurate page
    numbers. Needs doc.multiBuild(story) (not build()) — the TOC entries
    from pass N are only correct as of pass N+1."""

    def afterFlowable(self, flowable):
        bookmark = getattr(flowable, "_bookmark", None)
        if not bookmark:
            return
        level, key, title = bookmark
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(title, key, level=level, closed=False)
        self.notify("TOCEntry", (level, title, self.page, key))


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(_BODY_ITALIC, 8)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(
        PAGE_W / 2,
        12 * mm,
        "Plugga Sjöexamen — fristående studiehjälpmedel, ej anslutet till eller godkänt av Transportstyrelsen, NFB eller annat certifierande organ.",
    )
    canvas.drawRightString(PAGE_W - MARGIN, 12 * mm, str(doc.page))
    canvas.restoreState()


def _cover_footer(canvas, doc):
    pass  # cover page carries its own disclaimer text in the flow; no running footer


def build_document(output_path: str) -> BookDocTemplate:
    doc = BookDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title="Plugga Sjöexamen — Teoriboken",
        author="Plugga Sjöexamen",
    )
    cover_frame = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN, id="cover")
    body_frame = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN, id="body")
    doc.addPageTemplates(
        [
            PageTemplate(id="Cover", frames=[cover_frame], onPage=_cover_footer),
            PageTemplate(id="Body", frames=[body_frame], onPage=_footer),
        ]
    )
    return doc


def toc_flowable() -> TableOfContents:
    """TableOfContents.levelStyles is indexed by outline DEPTH (0 =
    chapter, 1 = topic) — it can't carry a per-entry draft/reviewed style.
    The draft/reviewed distinction is instead baked directly into each
    entry's title text (a leading warning glyph or a quiet "granskat"
    note) in generate_book.py, so it shows up identically in the visual
    TOC and in the PDF outline sidebar, both driven by the same title
    string via bookmarked()."""
    styles = get_styles()
    toc = TableOfContents()
    chapter_style = ParagraphStyle(
        "TOCChapter", parent=styles["TOCEntryReviewed"], fontName=_BODY_BOLD, spaceBefore=3 * mm
    )
    topic_style = ParagraphStyle(
        "TOCTopic", parent=styles["TOCEntryReviewed"], fontSize=10, leftIndent=8 * mm, textColor=MUTED
    )
    toc.levelStyles = [chapter_style, topic_style]
    return toc
