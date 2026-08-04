/**
 * Plugga Sjöexamen — color tokens.
 *
 * Single source of truth for color. Consumed by:
 *  - tailwind.config.js (semantic utilities via CSS variables in global.css)
 *  - TypeScript code that needs raw values (SVG diagrams, navigation theme)
 *
 * Palette is derived from nautical reference material: deep chart navy,
 * aged chart paper, restrained brass, and the port/starboard lantern pair
 * used as the app's semantic feedback colors (wrong = port red,
 * correct = starboard green). Deliberately NOT cream+terracotta, NOT
 * black+neon-green.
 *
 * Dark ("varm sjö") stays close to the original — deep bluish navy, warm
 * brass accent. Light ("kall sjö") is a deliberate cool arctic-chart
 * blue-grey rather than a warm-parchment inversion of dark; `brass` stays
 * warm in both so the one accent still pops against a cooler ground.
 * `tide` (secondary/informational) and `urgent` (Q/VQ-rhythm warning,
 * see DESIGN-RHYTHM.md) are the only two additions — kept to exactly two
 * so the palette stays a "one accent plus semantics" system, not a
 * sprawl. `starboard`/`port` are untouched.
 *
 * Plain JS (not TS) so tailwind.config.js can require it.
 */

const dark = {
  bg: '#0A1620', // deep bluish dark-sea navy — app background
  surface: '#122232', // charted water — cards, raised surfaces
  ink: '#ECE4D2', // aged chart paper — primary text on dark
  fog: '#8CA0AD', // muted slate-blue — secondary text, hairlines
  brass: '#CBA765', // restrained brass — the one accent
  tide: '#5FA8D3', // cool signal-blue — secondary/informational accent
  urgent: '#E08A4C', // warm amber-orange — Q/VQ-rhythm warning/urgency
  starboard: '#3FA372', // starboard lantern green — correct / go
  port: '#C65D4E', // port lantern red — incorrect / stop
};

const light = {
  bg: '#DEE7ED', // cool arctic chart-paper blue-grey — app background
  surface: '#EFF4F7', // fresh cool paper — cards, raised surfaces
  ink: '#16232E', // chart ink navy — primary text on light
  fog: '#526775',
  brass: '#8A6D2F', // darkened brass — stays warm for contrast on cool paper
  tide: '#2C6C93',
  urgent: '#B15B22',
  starboard: '#1F7A4D',
  port: '#A63E30',
};

/** hex -> "r g b" for CSS variables with <alpha-value> support */
function rgbTriplet(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

module.exports = { dark, light, rgbTriplet };
