#!/usr/bin/env node
/**
 * Guards against src/theme/colors.js and the CSS variables in src/global.css
 * drifting apart. Fails with a diff if any triplet mismatches.
 */
const fs = require('fs');
const path = require('path');
const { dark, light, rgbTriplet } = require('../src/theme/colors');

const css = fs.readFileSync(path.join(__dirname, '../src/global.css'), 'utf8');

// First :root block = dark (default), the @media light block = light.
const blocks = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1]);
if (blocks.length !== 2) {
  console.error(`check-tokens: expected 2 :root blocks in global.css, found ${blocks.length}`);
  process.exit(1);
}

function parseVars(block) {
  return Object.fromEntries(
    [...block.matchAll(/--color-([a-z]+):\s*([\d ]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
}

let failed = false;
for (const [scheme, palette, block] of [
  ['dark', dark, blocks[0]],
  ['light', light, blocks[1]],
]) {
  const cssVars = parseVars(block);
  for (const [name, hex] of Object.entries(palette)) {
    const expected = rgbTriplet(hex);
    if (cssVars[name] !== expected) {
      console.error(
        `check-tokens: ${scheme}.${name} mismatch — colors.js says "${expected}" (${hex}), global.css says "${cssVars[name] ?? 'MISSING'}"`,
      );
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('check-tokens: colors.js and global.css agree.');
