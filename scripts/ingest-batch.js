#!/usr/bin/env node
/**
 * Ingest converted question batches into content/.
 *
 * Usage: node scripts/ingest-batch.js <batch1.json> [batch2.json ...]
 *
 * Each batch file holds an array of items in the app item format plus a
 * temporary id and a mandatory sourceRef. This script validates, renumbers
 * ids per topic (continuing existing sequences), merges into the right
 * content/<module>/<topic>.json file (creating it when new), and prints
 * any registry lines that must be added to src/content/index.ts.
 * Coverage rows are appended to the file given via COVERAGE_TSV (optional).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const model = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/modules.json'), 'utf8'));

const MODULE_DIR = {
  'mod-colreg': 'colreg',
  'mod-lanterns': 'lanterns',
  'mod-buoyage': 'buoyage',
  'mod-navcalc': 'navcalc',
  'mod-weather': 'weather',
  'mod-safety': 'safety',
  'mod-stability': 'stability',
  'mod-vhf': 'vhf',
  'mod-radar': 'radar',
  'mod-seamanship': 'seamanship',
  'mod-rules': 'rules',
};

const ID_PREFIX = {
  'top-col-vajning': 'col-vaj',
  'top-col-ljud': 'col-ljud',
  'top-lan-grund': 'lan-grund',
  'top-lan-maskin': 'lan-maskin',
  'top-lan-segel': 'lan-segel',
  'top-lan-sarskilda': 'lan-sar',
  'top-lan-bilder': 'lan-bild',
  'top-buoy-lateral': 'buoy-lat',
  'top-buoy-kardinal': 'buoy-kard',
  'top-buoy-fyrar': 'buoy-fyr',
  'top-nav-sjokort': 'nav-sjo',
  'top-nav-kurs': 'nav-kurs',
  'top-nav-fart': 'nav-fart',
  'top-nav-instrument': 'nav-instr',
  'top-nav-baring': 'nav-bar',
  'top-weather-system': 'wx-sys',
  'top-weather-sikt': 'wx-sikt',
  'top-safety-nod': 'saf-nod',
  'top-safety-ombord': 'saf-omb',
  'top-safety-sjukvard': 'saf-sjuk',
  'top-sjo-fortojning': 'sjo-fort',
  'top-sjo-tagvirke': 'sjo-tag',
  'top-reg-miljo': 'reg-miljo',
  'top-reg-utland': 'reg-utl',
  'top-reg-sjolag': 'reg-lag',
  'top-stab-begrepp': 'stab-beg',
  'top-stab-praktik': 'stab-pra',
  'top-vhf-rutiner': 'vhf-rut',
  'top-vhf-dsc': 'vhf-dsc',
  'top-radar-grund': 'rad-gru',
  'top-radar-bild': 'rad-eko',
};

const topicsById = new Map(model.topics.map((t) => [t.id, t]));
const VALID_TRACKS = new Set(['forarintyg', 'kustskeppare', 'klass8', 'vhf']);
const VALID_TYPES = new Set([
  'mcq', 'scenario', 'calculation', 'lantern', 'buoy',
  'stability_diagram', 'chart_question', 'radar_question',
]);

function topicFilePath(topicId) {
  const topic = topicsById.get(topicId);
  const dir = MODULE_DIR[topic.moduleId];
  return path.join(ROOT, 'content', dir, `${topic.slug}.json`);
}

const errors = [];
const perFile = new Map(); // topicFile -> items to append
const coverage = [];
let processed = 0;

for (const batchArg of process.argv.slice(2)) {
  const batch = JSON.parse(fs.readFileSync(batchArg, 'utf8'));
  if (!Array.isArray(batch)) {
    errors.push(`${batchArg}: not an array`);
    continue;
  }
  for (const item of batch) {
    processed++;
    const where = `${path.basename(batchArg)} ${item.id ?? '(no id)'}`;
    const topic = topicsById.get(item.topicId);
    if (!topic) { errors.push(`${where}: unknown topicId ${item.topicId}`); continue; }
    if (!ID_PREFIX[item.topicId]) { errors.push(`${where}: no id prefix for ${item.topicId}`); continue; }
    if (!VALID_TYPES.has(item.type)) { errors.push(`${where}: bad type ${item.type}`); continue; }
    if (!Array.isArray(item.tracks) || !item.tracks.length || item.tracks.some((t) => !VALID_TRACKS.has(t))) {
      errors.push(`${where}: bad tracks`); continue;
    }
    if (!Array.isArray(item.options) || item.options.filter((o) => o.isCorrect === true).length !== 1) {
      errors.push(`${where}: needs exactly 1 correct option`); continue;
    }
    if (!item.payload?.questionSv) { errors.push(`${where}: missing payload.questionSv`); continue; }
    if (!item.sourceRef) { errors.push(`${where}: missing sourceRef`); continue; }
    if (item.type === 'lantern' && !item.payload?.scene?.lights?.length) {
      errors.push(`${where}: lantern without scene.lights`); continue;
    }

    const file = topicFilePath(item.topicId);
    if (!perFile.has(file)) perFile.set(file, []);
    perFile.get(file).push(item);
  }
}

if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`\ningest: ${errors.length} invalid items — nothing written.`);
  process.exit(1);
}

const newFiles = [];
for (const [file, items] of perFile) {
  const topicId = items[0].topicId;
  let doc;
  if (fs.existsSync(file)) {
    doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  } else {
    doc = { topicId, items: [] };
    newFiles.push(file);
  }
  const prefix = ID_PREFIX[topicId];
  let max = 0;
  for (const existing of doc.items) {
    const m = existing.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  for (const item of items) {
    const tempId = item.id;
    max++;
    item.id = `${prefix}-${String(max).padStart(3, '0')}`;
    item.authorReviewed = false;
    if (item.needsReview === undefined) item.needsReview = false;
    if (item.needsReviewNote === undefined) item.needsReviewNote = null;
    coverage.push(`${item.sourceRef}\t${tempId}\t${item.id}`);
    doc.items.push(item);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  console.log(`${path.relative(ROOT, file)}: +${items.length} (now ${doc.items.length})`);
}

if (process.env.COVERAGE_TSV) {
  fs.appendFileSync(process.env.COVERAGE_TSV, coverage.join('\n') + '\n');
}

if (newFiles.length) {
  console.log('\nAdd to TOPIC_FILES in src/content/index.ts:');
  for (const f of newFiles) {
    console.log(`  require('../../${path.relative(ROOT, f)}'),`);
  }
}
console.log(`\ningest: ${processed} items merged.`);
