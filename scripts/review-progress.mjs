#!/usr/bin/env node
/**
 * Standalone content-review progress snapshot. Reads content/*.json
 * directly (same file-walk as scripts/review-tool/server.js's buildIndex,
 * kept independent on purpose — this has no server/browser dependency, so
 * it works as a quick `npm run` check without opening anything).
 *
 * Prints a table: module, total items, authorReviewed:true count,
 * needsReview:true count, percent complete.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

const model = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'modules.json'), 'utf8'));
const modulesById = new Map(model.modules.map((m) => [m.id, m]));
const topicsById = new Map(model.topics.map((t) => [t.id, t]));

function contentFiles() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.json') && !['modules.json', 'exams.json'].includes(e.name)) {
        out.push(p);
      }
    }
  })(CONTENT_DIR);
  return out;
}

const byModule = new Map(); // moduleId -> { title, total, reviewed, flagged }
let totalAll = 0;
let reviewedAll = 0;
let flaggedAll = 0;

for (const file of contentFiles()) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const item of doc.items ?? []) {
    const topic = topicsById.get(item.topicId);
    const moduleId = topic?.moduleId ?? '?';
    const title = modulesById.get(moduleId)?.titleSv ?? moduleId;
    const cur = byModule.get(moduleId) ?? { title, total: 0, reviewed: 0, flagged: 0 };
    cur.total++;
    if (item.authorReviewed) cur.reviewed++;
    if (item.needsReview) cur.flagged++;
    byModule.set(moduleId, cur);

    totalAll++;
    if (item.authorReviewed) reviewedAll++;
    if (item.needsReview) flaggedAll++;
  }
}

const rows = [...byModule.values()].sort((a, b) => b.total - a.total);

function pad(str, width) {
  str = String(str);
  return str.length >= width ? str : str + ' '.repeat(width - str.length);
}
function padLeft(str, width) {
  str = String(str);
  return str.length >= width ? str : ' '.repeat(width - str.length) + str;
}

const MODULE_W = Math.max(6, ...rows.map((r) => r.title.length));

console.log(
  `${pad('MODUL', MODULE_W)}  ${padLeft('TOTALT', 6)}  ${padLeft('GRANSKAT', 8)}  ${padLeft('FLAGGAT', 7)}  KLART`,
);
console.log('-'.repeat(MODULE_W + 2 + 6 + 2 + 8 + 2 + 7 + 2 + 6));
for (const r of rows) {
  const pct = r.total ? Math.round((r.reviewed / r.total) * 100) : 0;
  console.log(
    `${pad(r.title, MODULE_W)}  ${padLeft(r.total, 6)}  ${padLeft(r.reviewed, 8)}  ${padLeft(r.flagged, 7)}  ${padLeft(pct + '%', 5)}`,
  );
}
console.log('-'.repeat(MODULE_W + 2 + 6 + 2 + 8 + 2 + 7 + 2 + 6));
const pctAll = totalAll ? Math.round((reviewedAll / totalAll) * 100) : 0;
console.log(
  `${pad('TOTALT', MODULE_W)}  ${padLeft(totalAll, 6)}  ${padLeft(reviewedAll, 8)}  ${padLeft(flaggedAll, 7)}  ${padLeft(pctAll + '%', 5)}`,
);
