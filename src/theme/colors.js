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
 * Plain JS (not TS) so tailwind.config.js can require it.
 */

const dark = {
  bg: '#0B141D', // deep-sea navy, near black — app background
  surface: '#13222F', // charted water — cards, raised surfaces
  ink: '#E9E2D0', // aged chart paper — primary text on dark
  fog: '#8B9DA9', // muted slate — secondary text, hairlines
  brass: '#C9A45C', // restrained brass — the one accent
  starboard: '#3FA372', // starboard lantern green — correct / go
  port: '#C65D4E', // port lantern red — incorrect / stop
};

const light = {
  bg: '#F1EBDD', // aged chart paper — app background
  surface: '#FAF6EB', // fresh paper — cards, raised surfaces
  ink: '#182634', // chart ink navy — primary text on light
  fog: '#5A6C79',
  brass: '#8A6D2F', // darkened brass for contrast on paper
  starboard: '#1F7A4D',
  port: '#A63E30',
};

/** hex -> "r g b" for CSS variables with <alpha-value> support */
function rgbTriplet(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

module.exports = { dark, light, rgbTriplet };
