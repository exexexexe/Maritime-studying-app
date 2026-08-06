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
  'map_question',
  'term_card',
  'radio_procedure',
];
const VALID_CHARTS = ['SE61', 'SE93'];
const VALID_MAP_ANSWER_KINDS = ['bearing', 'distance', 'position', 'depth'];
const VALID_CALL_TYPES = ['mayday', 'pan-pan', 'securite', 'routine', 'mob'];

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
  /^[\d,.]+°?$|^(vitt?|rött?|grönt?|gult?|vita|röda|gröna|gula|styrbord|babord|styrbords?sidan?|babords?sidan?|nord|syd|ost|väst|norr|söder|öster|väster|nordkardinal|sydkardinal|ostkardinal|västkardinal|lovart|lä|förut|akterut|uppåt|nedåt|moturs|medurs)$|^[a-h]$/;

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
const needsReviewItems = [];

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
    if (item.needsReview === true) {
      needsReviewItems.push(`${item.id}: ${item.needsReviewNote ?? '(no note)'}`);
    }
    // map_question, term_card, and radio_procedure have no payload — their
    // task text is `instructions` / `termSv` / `scenario` respectively
    // (see content/AUTHORING.md).
    if (
      !['map_question', 'term_card', 'radio_procedure'].includes(item.type) &&
      !item.payload?.questionSv
    ) {
      err(where, 'missing payload.questionSv');
    }
    if (item.type === 'lantern' && !item.payload?.scene?.lights?.length) {
      err(where, 'lantern item without payload.scene.lights');
    }
    // lightSectors — orbit trainer data (src/app/orbit/lantern.tsx,
    // content/AUTHORING.md). Optional; only a representative set of
    // lantern items carry it.
    if (item.type === 'lantern' && item.payload?.scene?.lightSectors) {
      const lights = item.payload.scene.lights ?? [];
      const lightIds = new Set(lights.map((l) => l.id).filter(Boolean));
      const sectors = item.payload.scene.lightSectors;
      if (!Array.isArray(sectors) || sectors.length === 0) {
        err(where, 'lightSectors present but empty or not an array');
      } else {
        sectors.forEach((s, i) => {
          if (!lightIds.has(s.lightId)) {
            err(where, `lightSectors[${i}].lightId "${s.lightId}" has no matching id in payload.scene.lights`);
          }
          if (typeof s.startDeg !== 'number' || !Number.isFinite(s.startDeg)) {
            err(where, `lightSectors[${i}] missing numeric startDeg`);
          }
          if (typeof s.endDeg !== 'number' || !Number.isFinite(s.endDeg)) {
            err(where, `lightSectors[${i}] missing numeric endDeg`);
          }
        });
      }
      // A light with an id but no sector is a real authoring foot-gun —
      // it would never appear in the orbit trainer at any angle.
      const sectorLightIds = new Set((Array.isArray(sectors) ? sectors : []).map((s) => s.lightId));
      for (const light of lights) {
        if (light.id && !sectorLightIds.has(light.id)) {
          warn(where, `light id "${light.id}" has no lightSectors entry — permanently invisible in the orbit trainer`);
        }
      }
    }
    if (item.type === 'buoy' && !item.payload?.scene?.colors?.length) {
      err(where, 'buoy item without payload.scene.colors');
    }
    if (
      item.type === 'stability_diagram' &&
      !['upright', 'heeled'].includes(item.payload?.scene?.variant)
    ) {
      err(where, 'stability_diagram item without a valid payload.scene.variant');
    }

    // term_card: a flashcard, not a graded question — the back reuses
    // explanationSv/explanationEn as its definition, already validated
    // above. No options.
    if (item.type === 'term_card') {
      if (typeof item.termSv !== 'string' || item.termSv.length < 1) {
        err(where, 'term_card missing termSv');
      }
      continue; // no options for term_card
    }

    // radio_procedure: tap-to-order VHF call construction — no payload/
    // options, see content/AUTHORING.md. requiredBlocks defines the
    // correct message in order; the pool shown to the student is
    // requiredBlocks + distractorBlocks, shuffled.
    if (item.type === 'radio_procedure') {
      if (!VALID_CALL_TYPES.includes(item.callType)) {
        err(where, `radio_procedure with invalid callType "${item.callType}" (expected one of ${VALID_CALL_TYPES.join(', ')})`);
      }
      if (typeof item.scenario !== 'string' || item.scenario.length < 10) {
        err(where, 'radio_procedure missing or too-short scenario');
      }
      if (typeof item.vesselName !== 'string' || item.vesselName.length < 1) {
        err(where, 'radio_procedure missing vesselName');
      }
      const required = item.requiredBlocks;
      if (!Array.isArray(required) || required.length < 3) {
        err(where, 'radio_procedure needs at least 3 requiredBlocks');
      } else {
        required.forEach((b, i) => {
          if (!b.id || typeof b.text !== 'string' || b.text.length < 1) {
            err(where, `requiredBlocks[${i}] missing id or text`);
          }
          if (b.order !== i + 1) {
            err(where, `requiredBlocks[${i}] has order ${b.order}, expected ${i + 1} (order must match array position)`);
          }
        });
      }
      const distractors = Array.isArray(item.distractorBlocks) ? item.distractorBlocks : [];
      distractors.forEach((b, i) => {
        if (!b.id || typeof b.text !== 'string' || b.text.length < 1) {
          err(where, `distractorBlocks[${i}] missing id or text`);
        }
      });
      if (distractors.length < 2) {
        warn(where, `only ${distractors.length} distractor blocks (aim for 3+)`);
      }
      const allBlockIds = [...(Array.isArray(required) ? required : []), ...distractors].map((b) => b.id);
      const seenBlockIds = new Set();
      for (const id of allBlockIds) {
        if (seenBlockIds.has(id)) err(where, `duplicate block id "${id}" within item`);
        seenBlockIds.add(id);
      }
      continue; // no options for radio_procedure
    }

    // map_question: requires a physical chart (SE61/SE93) — never rendered
    // in-app, see the copyright note in content/AUTHORING.md. answerMode
    // 'numeric_tolerance' has no options (skips the shared options check
    // below, like calculation); 'mcq' falls through to it as normal.
    if (item.type === 'map_question') {
      if (!VALID_CHARTS.includes(item.chartRef?.chart)) {
        err(where, `map_question with invalid chartRef.chart "${item.chartRef?.chart}" (expected ${VALID_CHARTS.join(' or ')})`);
      }
      if (typeof item.instructions !== 'string' || item.instructions.length < 10) {
        err(where, 'map_question missing or too-short instructions');
      }
      if (!['numeric_tolerance', 'mcq'].includes(item.answerMode)) {
        err(where, `map_question with invalid answerMode "${item.answerMode}"`);
      }
      if (item.answerMode === 'numeric_tolerance') {
        const a = item.answer;
        if (!a || !VALID_MAP_ANSWER_KINDS.includes(a.kind)) {
          err(where, `map_question numeric_tolerance with invalid answer.kind "${a?.kind}"`);
        } else if (a.kind === 'position') {
          if (typeof a.expected?.lat !== 'number' || typeof a.expected?.lon !== 'number') {
            err(where, 'map_question position answer needs numeric expected.lat/expected.lon');
          }
          if (typeof a.tolerance !== 'number' || a.tolerance <= 0) {
            err(where, 'map_question position answer needs a positive tolerance (meters)');
          }
        } else {
          if (typeof a.expected !== 'number') {
            err(where, 'map_question numeric answer needs a numeric expected value');
          }
          if (typeof a.tolerance !== 'number' || a.tolerance <= 0) {
            err(where, 'map_question numeric answer needs a positive tolerance');
          }
        }
        continue; // numeric_tolerance has no options — skip the shared check
      }
      // answerMode 'mcq' falls through to the shared options validation below.
    }

    // Generator-backed calculations produce options at runtime.
    // Keep this list in sync with GENERATOR_IDS in src/content/generators/navcalc.ts.
    const GENERATOR_IDS = [
      'compass-course',
      'true-course',
      'std-distance',
      'std-time',
      'std-speed',
      'current-speed',
    ];
    if (item.type === 'calculation') {
      if (!GENERATOR_IDS.includes(item.payload?.generator)) {
        err(where, `calculation item with unknown generator "${item.payload?.generator}"`);
      }
      continue; // options come from the generator
    }
    if (['chart_question', 'radar_question'].includes(item.type) && !item.imageAsset) {
      err(where, `${item.type} without imageAsset`);
    }
    if (item.imageAsset) {
      const imgPath = path.join(__dirname, '../assets/content-images', item.imageAsset);
      if (!fs.existsSync(imgPath)) {
        err(where, `imageAsset not found on disk: assets/content-images/${item.imageAsset}`);
      }
      const registry = fs.readFileSync(path.join(__dirname, '../src/content/images.ts'), 'utf8');
      if (!registry.includes(`'${item.imageAsset}'`)) {
        err(where, `imageAsset not registered in src/content/images.ts: ${item.imageAsset}`);
      }
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
// Default: errors in full, warnings summarized. --verbose lists every warning.
if (process.argv.includes('--verbose')) {
  for (const w of warnings) console.warn(`WARN  ${w}`);
} else if (warnings.length) {
  const byKind = {};
  for (const w of warnings) {
    const kind = w.includes('length outlier')
      ? 'option length outlier'
      : w.includes('near-duplicate')
        ? 'near-duplicate options'
        : 'other';
    byKind[kind] = (byKind[kind] ?? 0) + 1;
  }
  for (const [kind, n] of Object.entries(byKind)) {
    console.warn(`WARN  ${n}× ${kind} (run with --verbose for details)`);
  }
}
for (const e of errors) console.error(`ERROR ${e}`);

if (needsReviewItems.length && process.argv.includes('--needs-review')) {
  console.log('\nItems flagged needsReview:');
  for (const n of needsReviewItems) console.log(`  ${n}`);
}

console.log(
  `\ncheck-content: ${itemCount} items, ${errors.length} errors, ${warnings.length} warnings` +
    (unreviewedCount ? ` (${unreviewedCount} not authorReviewed` : '(' ) +
    (needsReviewItems.length ? `, ${needsReviewItems.length} flagged needsReview)` : ')'),
);
process.exit(errors.length ? 1 : 0);
