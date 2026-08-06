"""
Static PNG renderers for the app's three native diagram types (lantern
night-view, daytime buoy, stability cross-section) — NOT screenshots of
the running app. Each function re-implements the exact geometry and
colors from the corresponding React Native component
(src/components/lantern-diagram.tsx, buoy-diagram.tsx,
stability-diagram.tsx) directly against Pillow's ImageDraw, reading the
same payload.scene JSON the app renders from.

Why Pillow over an SVG/Node pipeline: the book-generation script is
already Python (reportlab), and Pillow needs no extra toolchain beyond
what's already installed for this script — one dependency list, one
`pip install`, no Node subprocess call from Python. Rendering at 4×
supersample then downsampling with LANCZOS gives clean anti-aliased
edges without a vector renderer.

Blinking light characteristics (payload.scene.lights[].characteristic)
have no meaning in a static image — every light is drawn "on" (steady),
matching how the app itself falls back under reduced motion.
"""

from __future__ import annotations

import math

from PIL import Image, ImageDraw, ImageFont

SUPERSAMPLE = 4

_LABEL_FONT_PATH = "/System/Library/Fonts/Helvetica.ttc"


def _label_font(px: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(_LABEL_FONT_PATH, px, index=0)
    except OSError:
        return ImageFont.load_default()


def _rgba(rgb: tuple, alpha: float) -> tuple:
    return (*rgb, round(alpha * 255))


def _new_canvas(field_w: int, field_h: int, scale: int, bg: tuple) -> tuple:
    s = scale * SUPERSAMPLE
    img = Image.new("RGBA", (field_w * s, field_h * s), (*bg, 255))
    return img, ImageDraw.Draw(img, "RGBA"), s


def _finish(img: Image.Image, field_w: int, field_h: int, scale: int) -> Image.Image:
    return img.convert("RGB").resize((field_w * scale, field_h * scale), Image.LANCZOS)


def _quad_bezier(p0, p1, p2, n=10):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
        pts.append((x, y))
    return pts


# --------------------------------------------------------------------------
# Lantern night-view — src/components/lantern-diagram.tsx
# --------------------------------------------------------------------------

NIGHT = (5, 11, 18)
HORIZON = (22, 36, 47)
LIGHT_COLORS = {
    "white": (248, 243, 226),
    "red": (242, 80, 60),
    "green": (56, 208, 126),
    "yellow": (242, 194, 48),
    "blue": (76, 141, 245),
}
GLOW_LAYERS = [(7, 0.12), (4.4, 0.22), (2.6, 0.4)]


def render_lantern(scene: dict, scale: int = 10) -> Image.Image:
    W, H = 100, 60
    img, draw, s = _new_canvas(W, H, scale, NIGHT)

    draw.line([(0, 46 * s), (W * s, 46 * s)], fill=_rgba(HORIZON, 0.5), width=max(1, round(0.5 * s)))

    for x0 in (8, 62):
        pts = []
        for i in range(13):
            x = x0 + i
            y = 51 + (1.4 if i % 4 in (1, 3) else 0) * (1 if x0 == 8 else 1)
            pts.append((x * s, (51 - 1.4 * math.sin(i * math.pi / 6)) * s))
        draw.line(pts, fill=_rgba(HORIZON, 0.4), width=max(1, round(0.4 * s)))

    if scene.get("hull") == "silhouette":
        pts = [(30, 46), (34, 42.5), (68, 42.5), (72, 46)]
        draw.polygon([(x * s, y * s) for x, y in pts], fill=_rgba(HORIZON, 0.8))

    for light in scene.get("lights", []):
        cx, cy = light["x"] * s, light["y"] * s
        color = LIGHT_COLORS[light["color"]]
        for r, op in GLOW_LAYERS:
            rr = r * s
            draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=_rgba(color, op))
        rr = 1.6 * s
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=_rgba(color, 1.0))

    return _finish(img, W, H, scale)


# --------------------------------------------------------------------------
# Daytime buoy — src/components/buoy-diagram.tsx
# --------------------------------------------------------------------------

SKY = (199, 212, 220)
SEA = (62, 92, 110)
BUOY_COLORS = {
    "red": (200, 51, 42),
    "green": (30, 122, 67),
    "yellow": (232, 180, 22),
    "black": (32, 36, 31),
    "white": (242, 239, 229),
}
FIELD_W, FIELD_H = 100, 60
WATER_Y = 48
CX = 50


def _cone(point_up: bool, cy: float, half_w: float = 3.6):
    if point_up:
        return [(CX - half_w, cy), (CX + half_w, cy), (CX, cy - 2 * half_w)]
    return [(CX - half_w, cy - 2 * half_w), (CX + half_w, cy - 2 * half_w), (CX, cy)]


def _draw_topmark(draw: ImageDraw.ImageDraw, kind: str, s: float) -> None:
    y = 14
    black = BUOY_COLORS["black"]
    if kind == "cones-up":
        for cy in (y - 9, y):
            draw.polygon([(x * s, yy * s) for x, yy in _cone(True, cy)], fill=_rgba(black, 1))
    elif kind == "cones-down":
        for cy in (y - 9, y):
            draw.polygon([(x * s, yy * s) for x, yy in _cone(False, cy)], fill=_rgba(black, 1))
    elif kind == "cones-base-to-base":
        draw.polygon([(x * s, yy * s) for x, yy in _cone(True, y - 9)], fill=_rgba(black, 1))
        draw.polygon([(x * s, yy * s) for x, yy in _cone(False, y)], fill=_rgba(black, 1))
    elif kind == "cones-point-to-point":
        draw.polygon([(x * s, yy * s) for x, yy in _cone(False, y - 9)], fill=_rgba(black, 1))
        draw.polygon([(x * s, yy * s) for x, yy in _cone(True, y)], fill=_rgba(black, 1))
    elif kind == "spheres-2":
        for cy in (y - 11, y - 3.5):
            r = 3 * s
            draw.ellipse([CX * s - r, cy * s - r, CX * s + r, cy * s + r], fill=_rgba(black, 1))
    elif kind == "sphere-red":
        r = 3.4 * s
        cy = (y - 4) * s
        draw.ellipse([CX * s - r, cy - r, CX * s + r, cy + r], fill=_rgba(BUOY_COLORS["red"], 1))
    elif kind == "x-yellow":
        col = _rgba(BUOY_COLORS["yellow"], 1)
        w = max(1, round(1.8 * s))
        draw.line([((CX - 3.4) * s, (y - 8) * s), ((CX + 3.4) * s, (y - 1) * s)], fill=col, width=w)
        draw.line([((CX + 3.4) * s, (y - 8) * s), ((CX - 3.4) * s, (y - 1) * s)], fill=col, width=w)
    elif kind == "cone-up-green":
        draw.polygon([(x * s, yy * s) for x, yy in _cone(True, y)], fill=_rgba(BUOY_COLORS["green"], 1))
    elif kind == "can-red":
        draw.rectangle(
            [(CX - 3.2) * s, (y - 7) * s, (CX + 3.2) * s, y * s], fill=_rgba(BUOY_COLORS["red"], 1)
        )


def render_buoy(scene: dict, scale: int = 10) -> Image.Image:
    img, draw, s = _new_canvas(FIELD_W, FIELD_H, scale, SKY)
    draw.rectangle([0, WATER_Y * s, FIELD_W * s, FIELD_H * s], fill=_rgba(SEA, 1))

    body_top, body_bottom = 15, WATER_Y + 2
    body_h = body_bottom - body_top
    half_w = 7
    colors = scene.get("colors", [])
    n = max(1, len(colors))

    if scene.get("pattern") == "vertical-stripes":
        w = (half_w * 2) / n
        for i, c in enumerate(colors):
            x0 = (CX - half_w + i * w) * s
            x1 = x0 + w * s
            draw.rectangle([x0, body_top * s, x1, body_bottom * s], fill=_rgba(BUOY_COLORS[c], 1))
    else:
        h = body_h / n
        for i, c in enumerate(colors):
            y0 = (body_top + i * h) * s
            y1 = y0 + h * s
            draw.rectangle([(CX - half_w) * s, y0, (CX + half_w) * s, y1], fill=_rgba(BUOY_COLORS[c], 1))

    if scene.get("topmark"):
        _draw_topmark(draw, scene["topmark"], s)

    return _finish(img, FIELD_W, FIELD_H, scale)


# --------------------------------------------------------------------------
# Stability cross-section — src/components/stability-diagram.tsx
# --------------------------------------------------------------------------

STAB_HULL = (32, 36, 31)
STAB_HULL_FILL = (242, 239, 229)
STAB_POINT = (200, 51, 42)
STAB_ARM = (176, 122, 24)

SW, SH = 100, 64
S_WATER_Y = 34
S_CX = 50
S_KEEL_Y = 52
KB, KG, KM = 6, 14, 24


def _rotate(x: float, y: float, cx: float, cy: float, deg: float) -> tuple:
    r = math.radians(deg)
    dx, dy = x - cx, y - cy
    return (cx + dx * math.cos(r) - dy * math.sin(r), cy + dx * math.sin(r) + dy * math.cos(r))


def render_stability(scene: dict, scale: int = 10) -> Image.Image:
    img, draw, s = _new_canvas(SW, SH, scale, SKY)
    draw.rectangle([0, S_WATER_Y * s, SW * s, SH * s], fill=_rgba(SEA, 1))

    heel_deg = 18 if scene.get("variant") == "heeled" else 0
    r = math.radians(heel_deg)
    sin, cos = math.sin(r), math.cos(r)

    def pt(x, h):
        return (S_CX + x * cos + h * sin, S_KEEL_Y - h * cos + x * sin)

    k_pt = (S_CX, S_KEEL_Y)
    g_pt = pt(0, KG)
    m_pt = pt(0, KM)
    b_shift = (KM - KB) * (sin / cos) if heel_deg else 0
    b_pt = pt(b_shift, KB)

    # Hull outline, in local (unrotated) coordinates, then rotated about
    # the keel to match the SVG's `rotate(heelDeg, CX, KEEL_Y)`.
    local = [(S_CX - 22, 24), (S_CX - 22, 42)]
    local += _quad_bezier((S_CX - 22, 42), (S_CX - 22, 52), (S_CX - 10, 53))[1:]
    local.append((S_CX + 10, 53))
    local += _quad_bezier((S_CX + 10, 53), (S_CX + 22, 52), (S_CX + 22, 42))[1:]
    local.append((S_CX + 22, 24))
    hull = [_rotate(x, y, S_CX, S_KEEL_Y, heel_deg) for x, y in local]
    draw.polygon([(x * s, y * s) for x, y in hull], fill=_rgba(STAB_HULL_FILL, 1), outline=_rgba(STAB_HULL, 1))

    cl0 = _rotate(S_CX, 20, S_CX, S_KEEL_Y, heel_deg)
    cl1 = _rotate(S_CX, 53, S_CX, S_KEEL_Y, heel_deg)
    draw.line([(cl0[0] * s, cl0[1] * s), (cl1[0] * s, cl1[1] * s)], fill=_rgba(STAB_HULL, 0.6), width=max(1, round(0.5 * s)))

    draw.line([(4 * s, S_WATER_Y * s), ((SW - 4) * s, S_WATER_Y * s)], fill=_rgba(STAB_HULL_FILL, 1), width=max(1, round(0.7 * s)))

    font = _label_font(round(5.5 * s))

    if heel_deg > 0:
        draw.line([(b_pt[0] * s, b_pt[1] * s), (b_pt[0] * s, m_pt[1] * s)], fill=_rgba(STAB_ARM, 0.7), width=max(1, round(0.7 * s)))
        draw.line([(g_pt[0] * s, g_pt[1] * s), (b_pt[0] * s, g_pt[1] * s)], fill=_rgba(STAB_ARM, 1), width=max(1, round(1.2 * s)))
        draw.text(((g_pt[0] - 10) * s, (g_pt[1] - 4) * s), "GZ", fill=_rgba(STAB_ARM, 1), font=font)

    marks = set(scene.get("markPoints") or ["K", "B", "G", "M"])
    for label, p in (("K", k_pt), ("B", b_pt), ("G", g_pt), ("M", m_pt)):
        if label not in marks:
            continue
        rr = 1.8 * s
        draw.ellipse([p[0] * s - rr, p[1] * s - rr, p[0] * s + rr, p[1] * s + rr], fill=_rgba(STAB_POINT, 1))
        draw.text((p[0] * s + 3.2 * s, p[1] * s - 3.2 * s), label, fill=_rgba(STAB_HULL, 1), font=font)

    return _finish(img, SW, SH, scale)
