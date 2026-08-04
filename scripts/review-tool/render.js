/**
 * Server-rendered SVG previews for review-tool item cards.
 *
 * Faithful ports of the app's diagram components (src/components/
 * lantern-diagram.tsx, buoy-diagram.tsx, stability-diagram.tsx) down to
 * plain-JS SVG string builders — colors and geometry mirror the real
 * on-device rendering closely enough to review correctness. Buoy topmark
 * shapes are simplified (labelled boxes instead of precise cones/spheres)
 * since the reviewer's job is checking color/pattern/topmark *type*
 * against the answer, not pixel fidelity.
 */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const NIGHT = '#050B12';
const HORIZON = '#16242F';
const LIGHT_COLORS = { white: '#F8F3E2', red: '#F2503C', green: '#38D07E', yellow: '#F2C230', blue: '#4C8DF5' };

function lanternSvg(scene) {
  if (!scene?.lights?.length) return '<p class="muted">Ingen scen-data.</p>';
  const lights = scene.lights
    .map(
      (l) => `<circle cx="${l.x}" cy="${l.y}" r="7" fill="${LIGHT_COLORS[l.color] ?? '#fff'}" opacity="0.18"/>
      <circle cx="${l.x}" cy="${l.y}" r="1.6" fill="${LIGHT_COLORS[l.color] ?? '#fff'}"/>`,
    )
    .join('');
  return `<svg viewBox="0 0 100 60" style="width:100%;max-width:420px;background:${NIGHT};border-radius:8px">
    <line x1="0" y1="46" x2="100" y2="46" stroke="${HORIZON}" stroke-width="0.5"/>
    ${lights}
  </svg>${scene.captionSv ? `<p class="caption">${esc(scene.captionSv)}</p>` : ''}`;
}

const BUOY_COLORS = { red: '#C8332A', green: '#1E7A43', yellow: '#E8B416', black: '#20241F', white: '#F2EFE5' };
const SKY = '#C7D4DC', SEA = '#3E5C6E';

function buoySvg(scene) {
  if (!scene?.colors?.length) return '<p class="muted">Ingen scen-data.</p>';
  const bodyTop = 15, waterY = 48, bodyBottom = waterY + 2, bodyH = bodyBottom - bodyTop, cx = 50, halfW = 7;
  let body = '';
  if (scene.pattern === 'vertical-stripes') {
    const w = (halfW * 2) / scene.colors.length;
    body = scene.colors
      .map((c, i) => `<rect x="${cx - halfW + i * w}" y="${bodyTop}" width="${w}" height="${bodyH}" fill="${BUOY_COLORS[c]}"/>`)
      .join('');
  } else {
    const h = bodyH / scene.colors.length;
    body = scene.colors
      .map((c, i) => `<rect x="${cx - halfW}" y="${bodyTop + i * h}" width="${halfW * 2}" height="${h}" fill="${BUOY_COLORS[c]}"/>`)
      .join('');
  }
  const topmark = scene.topmark
    ? `<text x="${cx}" y="8" text-anchor="middle" font-size="5" fill="${BUOY_COLORS.black}" font-family="monospace">${esc(scene.topmark)}</text>`
    : '';
  return `<svg viewBox="0 0 100 60" style="width:100%;max-width:420px;border-radius:8px">
    <rect x="0" y="0" width="100" height="${waterY}" fill="${SKY}"/>
    <rect x="0" y="${waterY}" width="100" height="${60 - waterY}" fill="${SEA}"/>
    ${body}${topmark}
  </svg>${scene.captionSv ? `<p class="caption">${esc(scene.captionSv)}</p>` : ''}`;
}

const HULL = '#20241F', HULL_FILL = '#F2EFE5', POINT = '#C8332A', ARM = '#B07A18';

function stabilitySvg(scene) {
  if (!scene?.variant) return '<p class="muted">Ingen scen-data.</p>';
  const heelDeg = scene.variant === 'heeled' ? 18 : 0;
  const r = (heelDeg * Math.PI) / 180, sin = Math.sin(r), cos = Math.cos(r);
  const cx = 50, keelY = 52, KB = 6, KG = 14, KM = 24;
  const pt = (x, h) => ({ x: cx + x * cos + h * sin, y: keelY - h * cos + x * sin });
  const kPt = { x: cx, y: keelY }, gPt = pt(0, KG), mPt = pt(0, KM);
  const bShift = heelDeg ? (KM - KB) * (sin / cos) : 0;
  const bPt = pt(bShift, KB);
  const marks = new Set(scene.markPoints ?? ['K', 'B', 'G', 'M']);
  const gz =
    heelDeg > 0
      ? `<line x1="${bPt.x}" y1="${bPt.y}" x2="${bPt.x}" y2="${mPt.y}" stroke="${ARM}" stroke-width="0.7" stroke-dasharray="1.5 1.5"/>
         <line x1="${gPt.x}" y1="${gPt.y}" x2="${bPt.x}" y2="${gPt.y}" stroke="${ARM}" stroke-width="1.2"/>
         <text x="${gPt.x - 9}" y="${gPt.y + 1.6}" font-size="5" fill="${ARM}">GZ</text>`
      : '';
  const points = [
    ['K', kPt],
    ['B', bPt],
    ['G', gPt],
    ['M', mPt],
  ]
    .filter(([l]) => marks.has(l))
    .map(([l, p]) => `<circle cx="${p.x}" cy="${p.y}" r="1.6" fill="${POINT}"/><text x="${p.x + 3}" y="${p.y + 1.6}" font-size="5" fill="${HULL}">${l}</text>`)
    .join('');
  return `<svg viewBox="0 0 100 64" style="width:100%;max-width:420px;background:#C7D4DC;border-radius:8px">
    <g transform="rotate(${heelDeg} ${cx} ${keelY})">
      <path d="M${cx - 22} 24 L${cx - 22} 42 Q${cx - 22} 52 ${cx - 10} 53 L${cx + 10} 53 Q${cx + 22} 52 ${cx + 22} 42 L${cx + 22} 24"
        fill="${HULL_FILL}" stroke="${HULL}" stroke-width="1.2"/>
    </g>
    ${gz}${points}
  </svg>${scene.captionSv ? `<p class="caption">${esc(scene.captionSv)}</p>` : ''}`;
}

module.exports = { lanternSvg, buoySvg, stabilitySvg, esc };
