#!/usr/bin/env node
/**
 * Content validation for Plugga Sjöexamen.
 *
 * ERRORS (exit 1): structural problems that would break the app.
 * WARNINGS: distractor-quality smells per content/AUTHORING.md — the build
 * stays green, but fix them before marking items authorReviewed.
 *
 * Run: npm run check:content
 */
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../content');
const VALID_TRACKS = ['forarintyg', 'kustskeppare', 'klass8', 'vhf'];
const VALID_TYPES = [
  'mcq',
  'scenario',
  'calculation',
  'lantern',
  'buoy',
  'stability_diagram',
  'chart_question',
  'radar_question',
];

const errors = [];
const warnings = [];

function err(where, msg) {
  errors.push(`${where}: ${msg}`);
}
function warn(where, msg) {
  warnings.push(`${where}: ${msg}`);
}

// --- load model ---------------------------------------------------------
const modelPath = path.join(CONTENT_DIR, 'modules.json');
const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
const moduleIds = new Set(model.modules.map((m) => m.id));
const topicIds = new Set(model.topics.map((t) => t.id));

for (const t of model.topics) {
  if (!moduleIds.has(t.moduleId)) {
    err(`modules.json topic ${t.id}`, `unknown moduleId "${t.moduleId}"`);
  }
}

// --- collect topic files ------------------------------------------------
function topicFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return topicFiles(p);
    if (!e.name.endsWith('.json')) return [];
    if (['modules.json', 'exams.json'].includes(e.name)) return [];
    return [p];
  });
}

// --- distractor-quality helpers ----------------------------------------
function normalize(s) {
  return s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
}

// Tokens that legitimately carry the whole difference between two options
// in parallel-structure distractor sets ("135° …" vs "225° …", "vitt" vs
// "rött"). Differences confined to these are good authoring, not smells.
const KEY_TOKEN =
  /^[\d,.]+°?$|^(vitt?|rött?|grönt?|gult?|vita|röda|gröna|gula|styrbord|babord|styrbords?sidan?|babords?sidan?|nord|syd|ost|väst|norr|söder|öster|väster|nordkardinal|sydkardinal|ostkardinal|västkardinal|lovart|lä|förut|akterut|uppåt|nedåt)$/;

function isParallelStructure(aTokens, bTokens) {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  const onlyA = aTokens.filter((t) => !bSet.has(t));
  const onlyB = bTokens.filter((t) => !aSet.has(t));
  if (onlyA.length === 0 && onlyB.length === 0) {
    // Same words, different order ("rött över grönt" vs "grönt över rött") —
    // ordering is the point; a deliberate distractor.
    return aTokens.join(' ') !== bTokens.join(' ');
  }
  return [...onlyA, ...onlyB].every((t) => KEY_TOKEN.test(t));
}

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

// --- validate items -----------------------------------------------------
const seenItemIds = new Set();
let itemCount = 0;
let unreviewedCount = 0;

for (const file of topicFiles(CONTENT_DIR)) {
  const rel = path.relative(CONTENT_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(rel, `invalid JSON: ${e.message}`);
    continue;
  }

  if (!data.topicId || !topicIds.has(data.topicId)) {
    err(rel, `unknown or missing topicId "${data.topicId}"`);
  }
  if (!Array.isArray(data.items)) {
    err(rel, 'missing items array');
    continue;
  }

  for (const item of data.items) {
    itemCount++;
    const where = `${rel} → ${item.id ?? '(no id)'}`;

    if (!item.id) err(where, 'missing id');
    else if (seenItemIds.has(item.id)) err(where, 'duplicate item id');
    else seenItemIds.add(item.id);

    if (item.topicId !== data.topicId) {
      err(where, `topicId "${item.topicId}" differs from file topicId "${data.topicId}"`);
    }
    if (!VALID_TYPES.includes(item.type)) err(where, `invalid type "${item.type}"`);
    if (
      !Array.isArray(item.tracks) ||
      item.tracks.length === 0 ||
      item.tracks.some((t) => !VALID_TRACKS.includes(t))
    ) {
      err(where, `invalid tracks ${JSON.stringify(item.tracks)}`);
    }
    if (typeof item.explanationSv !== 'string' || item.explanationSv.length < 10) {
      err(where, 'missing or too-short explanationSv');
    }
    if (typeof item.authorReviewed !== 'boolean') {
      err(where, 'missing authorReviewed flag');
    } else if (!item.authorReviewed) {
      unreviewedCount++;
    }
    if (!item.payload?.questionSv) err(where, 'missing payload.questionSv');
    if (item.type === 'lantern' && !item.payload?.scene?.lights?.length) {
      err(where, 'lantern item without payload.scene.lights');
    }
    if (['chart_question', 'radar_question'].includes(item.type) && !item.imageAsset) {
      err(where, `${item.type} without imageAsset`);
    }

    // options
    if (!Array.isArray(item.options) || item.options.length < 2) {
      err(where, 'needs at least 2 options');
      continue;
    }
    const correct = item.options.filter((o) => o.isCorrect === true);
    if (correct.length !== 1) {
      err(where, `must have exactly 1 correct option, found ${correct.length}`);
    }

    // distractor-quality warnings (see content/AUTHORING.md)
    const distractors = item.options.length - correct.length;
    if (distractors < 3) warn(where, `only ${distractors} distractors (aim for 3)`);

    const lengths = item.options.map((o) => o.text.length);
    const others = (i) => lengths.filter((_, j) => j !== i);
    lengths.forEach((len, i) => {
      const avg = others(i).reduce((a, b) => a + b, 0) / others(i).length;
      if (len > avg * 1.8 || len < avg * 0.45) {
        const tag = item.options[i].isCorrect ? 'correct option' : 'distractor';
        warn(where, `option length outlier (${tag}, ${len} chars vs ~${Math.round(avg)} avg): "${item.options[i].text.slice(0, 40)}…"`);
      }
    });

    for (let i = 0; i < item.options.length; i++) {
      for (let j = i + 1; j < item.options.length; j++) {
        const a = normalize(item.options[i].text);
        const b = normalize(item.options[j].text);
        if (a !== b && isParallelStructure(a.split(' '), b.split(' '))) continue;
        const dist = editDistance(a, b);
        if (a === b || dist <= Math.max(2, Math.min(a.length, b.length) * 0.12)) {
          warn(where, `near-duplicate options: "${item.options[i].text}" / "${item.options[j].text}"`);
        }
      }
    }
  }
}

// --- report -------------------------------------------------------------
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  `\ncheck-content: ${itemCount} items, ${errors.length} errors, ${warnings.length} warnings` +
    (unreviewedCount ? ` (${unreviewedCount} items not yet authorReviewed)` : ''),
);
process.exit(errors.length ? 1 : 0);
