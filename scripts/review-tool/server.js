#!/usr/bin/env node
/**
 * Local content-review tool. Run with `npm run review`, open
 * http://localhost:4848. Reads/writes content/*.json directly on disk —
 * no build step, no app changes. The running Expo app already picks up
 * edits on next reload via its existing require() registry.
 *
 * Never auto-approves anything: authorReviewed only flips to true when a
 * human clicks "Godkänn" in the browser.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { lanternSvg, buoySvg, stabilitySvg, esc } = require('./render');
const { replaceItemInSource } = require('./patch');

const ROOT = path.join(__dirname, '../..');
const CONTENT_DIR = path.join(ROOT, 'content');
const QUESTIONS_DIR = path.join(ROOT, 'questions');
const ASSETS_DIR = path.join(ROOT, 'assets/content-images');
const PORT = process.env.REVIEW_PORT ? Number(process.env.REVIEW_PORT) : 4848;

const model = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'modules.json'), 'utf8'));
const modulesById = new Map(model.modules.map((m) => [m.id, m]));
const topicsById = new Map(model.topics.map((t) => [t.id, t]));

// --- index: item id -> { file, topicId, moduleId } ----------------------
function contentFiles() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.json') && !['modules.json', 'exams.json'].includes(e.name)) out.push(p);
    }
  })(CONTENT_DIR);
  return out;
}

function buildIndex() {
  const items = [];
  for (const file of contentFiles()) {
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    doc.items.forEach((item, i) => {
      const topic = topicsById.get(item.topicId);
      items.push({
        item,
        file,
        indexInFile: i,
        topicId: item.topicId,
        topicTitle: topic?.titleSv ?? item.topicId,
        moduleId: topic?.moduleId ?? '?',
        moduleTitle: modulesById.get(topic?.moduleId)?.titleSv ?? '?',
      });
    });
  }
  return items;
}

/**
 * Re-reads the file (in case it changed since the index was built), applies
 * `mutate` to a deep copy of the target item, then patches just that one
 * item's substring back into the raw file text — see patch.js for why we
 * don't just JSON.stringify() the whole document.
 */
function saveItem(entry, mutate) {
  const text = fs.readFileSync(entry.file, 'utf8');
  const doc = JSON.parse(text);
  const current = doc.items.find((it) => it.id === entry.item.id);
  if (!current) throw new Error(`item ${entry.item.id} not found in ${entry.file} (was it renumbered?)`);
  const updated = JSON.parse(JSON.stringify(current)); // deep copy
  mutate(updated);
  fs.writeFileSync(entry.file, replaceItemInSource(text, entry.item.id, updated));
}

// --- layout ---------------------------------------------------------------
const STYLE = `
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { background:#0A1620; color:#ECE4D2; font-family: -apple-system, system-ui, sans-serif; margin:0; }
  a { color:#CBA765; }
  header { position:sticky; top:0; background:#122232; border-bottom:1px solid #ffffff1a; padding:14px 20px; z-index:5; }
  header h1 { font-size:16px; margin:0 0 8px; letter-spacing:0.03em; }
  .progress-bar { height:6px; background:#ffffff14; border-radius:99px; overflow:hidden; max-width:640px; }
  .progress-fill { height:100%; background:#CBA765; }
  .progress-text { font-size:12px; color:#8CA0AD; margin-top:6px; font-family: ui-monospace, monospace; }
  .modtable { display:flex; flex-wrap:wrap; gap:6px 16px; margin-top:10px; font-size:11px; font-family: ui-monospace, monospace; color:#8CA0AD;}
  .modtable a { color:#8CA0AD; text-decoration:none; }
  .modtable a:hover { color:#CBA765; }
  main { max-width:900px; margin:0 auto; padding:20px; }
  .filters { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; align-items:center; font-size:13px;}
  .filters select, .filters input { background:#122232; color:#ECE4D2; border:1px solid #ffffff26; border-radius:6px; padding:6px 10px; font-size:13px; }
  .card { background:#122232; border:1px solid #ffffff1a; border-radius:10px; padding:14px 16px; margin-bottom:10px; }
  .card a.iid { font-family: ui-monospace, monospace; font-size:12px; color:#8CA0AD; text-decoration:none; }
  .card .q { font-size:14px; margin:6px 0 4px; }
  .badge { display:inline-block; font-size:10px; padding:2px 7px; border-radius:99px; font-family: ui-monospace, monospace; margin-left:6px; }
  .badge.ok { background:#3FA37233; color:#3FA372; }
  .badge.flag { background:#C65D4E33; color:#C65D4E; }
  .badge.pending { background:#ffffff14; color:#8CA0AD; }
  .toolbar { display:flex; gap:8px; margin-top:10px; }
  button, .btn { background:#1c2c3a; color:#ECE4D2; border:1px solid #ffffff26; border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer; text-decoration:none; }
  button.approve { background:#3FA37222; border-color:#3FA37266; color:#3FA372; }
  button.flag { background:#C65D4E22; border-color:#C65D4E66; color:#C65D4E; }
  .detail label { display:block; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#8CA0AD; margin:14px 0 4px; }
  .detail textarea, .detail input[type=text] { width:100%; background:#0A1620; color:#ECE4D2; border:1px solid #ffffff26; border-radius:6px; padding:8px; font-size:14px; font-family:inherit; }
  .detail textarea { min-height:64px; }
  .opt-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .opt-row input[type=text] { flex:1; }
  .opt-row.correct input[type=text] { border-color:#3FA37288; }
  .caption { font-size:11px; color:#8CA0AD; text-transform:uppercase; letter-spacing:0.05em; margin-top:4px;}
  .muted { color:#8CA0AD; font-size:13px; }
  .sourceRef { font-family: ui-monospace, monospace; font-size:12px; color:#8CA0AD; background:#0A1620; padding:8px 10px; border-radius:6px; margin-top:10px;}
  .photos { display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; }
  .photos img { max-width:260px; border-radius:6px; border:1px solid #ffffff26; }
  .explain { background:#0A1620; padding:10px 12px; border-radius:8px; margin-top:6px; font-size:13px; }
  .explain + .explain { margin-top:8px; }
  .save-bar { position:sticky; bottom:0; background:#122232; border-top:1px solid #ffffff1a; padding:12px 16px; margin:24px -16px -16px; display:flex; gap:10px; }
  .save-bar button { padding:9px 16px; font-size:13px; }
  form { margin:0; }
</style>`;

function layout(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${STYLE}</head><body>${body}</body></html>`;
}

function headerHtml(items, activeModuleId) {
  const total = items.length;
  const reviewed = items.filter((e) => e.item.authorReviewed).length;
  const pct = total ? Math.round((reviewed / total) * 100) : 0;
  const byMod = new Map();
  for (const e of items) {
    const k = e.moduleId;
    const cur = byMod.get(k) ?? { title: e.moduleTitle, total: 0, reviewed: 0, flagged: 0 };
    cur.total++;
    if (e.item.authorReviewed) cur.reviewed++;
    if (e.item.needsReview) cur.flagged++;
    byMod.set(k, cur);
  }
  const modLinks = [...byMod.entries()]
    .sort((a, b) => a[1].total - b[1].total) // smallest modules first — easiest wins
    .map(
      ([id, m]) =>
        `<a href="/?module=${id}"${id === activeModuleId ? ' style="color:#CBA765"' : ''}>${esc(m.title)} ${m.reviewed}/${m.total}${m.flagged ? ` ⚑${m.flagged}` : ''}</a>`,
    )
    .join('');
  return `<header>
    <h1><a href="/" style="color:inherit;text-decoration:none">Plugga Sjöexamen — innehållsgranskning</a></h1>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div class="progress-text">${reviewed} / ${total} granskade (${pct}%)</div>
    <div class="modtable">${modLinks}</div>
  </header>`;
}

// --- list view --------------------------------------------------------
function listView(items, query) {
  const status = query.status ?? 'unreviewed';
  const moduleFilter = query.module ?? '';
  const q = (query.q ?? '').toLowerCase().trim();

  let filtered = items;
  if (moduleFilter) filtered = filtered.filter((e) => e.moduleId === moduleFilter);
  if (status === 'unreviewed') filtered = filtered.filter((e) => !e.item.authorReviewed);
  else if (status === 'reviewed') filtered = filtered.filter((e) => e.item.authorReviewed);
  else if (status === 'flagged') filtered = filtered.filter((e) => e.item.needsReview);
  if (q) {
    filtered = filtered.filter((e) => {
      const hay = `${e.item.id} ${e.item.payload?.questionSv ?? ''} ${(e.item.options ?? []).map((o) => o.text).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }
  // unreviewed-first ordering within the current filter
  filtered.sort((a, b) => Number(a.item.authorReviewed) - Number(b.item.authorReviewed));

  const moduleOptions = model.modules
    .map((m) => `<option value="${m.id}" ${m.id === moduleFilter ? 'selected' : ''}>${esc(m.titleSv)}</option>`)
    .join('');

  const rows = filtered
    .slice(0, 200)
    .map((e) => {
      const it = e.item;
      const badge = it.authorReviewed
        ? '<span class="badge ok">granskad</span>'
        : it.needsReview
          ? '<span class="badge flag">flaggad</span>'
          : '<span class="badge pending">ej granskad</span>';
      const qText = it.payload?.questionSv ?? `[${it.type}] ${it.id}`;
      return `<div class="card">
        <a class="iid" href="/item/${encodeURIComponent(it.id)}">${esc(it.id)}</a>${badge}
        <div class="q">${esc(qText)}</div>
        <div class="caption">${esc(e.moduleTitle)} · ${esc(e.topicTitle)}</div>
      </div>`;
    })
    .join('');

  const overflow = filtered.length > 200 ? `<p class="muted">Visar 200 av ${filtered.length} — filtrera eller sök för att smalna av.</p>` : '';

  return layout(
    'Granskning',
    `${headerHtml(items, moduleFilter)}
    <main>
      <form class="filters" method="get" action="/">
        <select name="module" onchange="this.form.submit()">
          <option value="">Alla moduler</option>
          ${moduleOptions}
        </select>
        <select name="status" onchange="this.form.submit()">
          <option value="unreviewed" ${status === 'unreviewed' ? 'selected' : ''}>Ej granskade</option>
          <option value="flagged" ${status === 'flagged' ? 'selected' : ''}>Flaggade</option>
          <option value="reviewed" ${status === 'reviewed' ? 'selected' : ''}>Granskade</option>
          <option value="all" ${status === 'all' ? 'selected' : ''}>Alla</option>
        </select>
        <input type="text" name="q" placeholder="Sök id eller text…" value="${esc(query.q ?? '')}">
        <button type="submit">Filtrera</button>
      </form>
      ${rows || '<p class="muted">Inga poster matchar filtret.</p>'}
      ${overflow}
    </main>`,
  );
}

// --- item detail / edit view -------------------------------------------
function findPhotoRefs(sourceRef) {
  if (!sourceRef) return [];
  const names = [...sourceRef.matchAll(/photo_\d+_2026-08-03_19-09-43/g)].map((m) => m[0]);
  // sourceRef sometimes shortens to "photo_NN" without the full suffix
  const short = [...sourceRef.matchAll(/photo_(\d+)(?!\S*2026)/g)].map((m) => `photo_${m[1]}_2026-08-03_19-09-43`);
  return [...new Set([...names, ...short])]
    .map((n) => `${n}.jpg`)
    .filter((f) => fs.existsSync(path.join(QUESTIONS_DIR, f)));
}

function scenePreview(item) {
  const scene = item.payload?.scene;
  if (item.type === 'lantern') return lanternSvg(scene);
  if (item.type === 'buoy') return buoySvg(scene);
  if (item.type === 'stability_diagram') return stabilitySvg(scene);
  return '';
}

function detailView(entry, items) {
  const it = entry.item;
  const photos = findPhotoRefs(it.sourceRef);
  const preview = scenePreview(it);

  const imageBlock = it.imageAsset
    ? `<label>Bild (imageAsset)</label><img src="/asset/${encodeURIComponent(it.imageAsset)}" style="max-width:100%;border-radius:8px;border:1px solid #ffffff26">`
    : '';

  const isGenerated = it.type === 'calculation';
  const optionsBlock = isGenerated
    ? `<p class="muted">Genererad beräkningsfråga (typ: calculation) — alternativ skapas vid körning av
       <code>src/content/generators/navcalc.ts</code> (generator: ${esc(it.payload?.generator ?? '?')}).
       Granska frågetexten och förklaringen nedan; formeln är redan testtäckt.</p>`
    : (it.options ?? [])
        .map(
          (o, i) => `<div class="opt-row ${o.isCorrect ? 'correct' : ''}">
        <input type="radio" name="correct" value="${i}" ${o.isCorrect ? 'checked' : ''} title="Rätt svar">
        <input type="text" name="opt_${i}" value="${esc(o.text)}">
      </div>`,
        )
        .join('');

  const photosBlock = photos.length
    ? `<div class="photos">${photos.map((f) => `<a href="/photo/${encodeURIComponent(f)}" target="_blank"><img src="/photo/${encodeURIComponent(f)}"></a>`).join('')}</div>`
    : it.sourceRef
      ? '<p class="muted">Inga matchande foton hittades lokalt för denna sourceRef.</p>'
      : '';

  return layout(
    it.id,
    `${headerHtml(items, entry.moduleId)}
    <main>
      <p><a href="javascript:history.back()">‹ Tillbaka till listan</a></p>
      <h2 style="font-family:ui-monospace,monospace;font-size:15px;margin-bottom:2px">${esc(it.id)}</h2>
      <p class="caption">${esc(entry.moduleTitle)} · ${esc(entry.topicTitle)} · typ: ${esc(it.type)} · spår: ${esc((it.tracks ?? []).join(', '))}</p>

      <form method="post" action="/item/${encodeURIComponent(it.id)}">
        <label>Fråga (payload.questionSv)</label>
        <textarea name="questionSv">${esc(it.payload?.questionSv ?? '')}</textarea>

        ${preview ? `<label>Förhandsgranskning</label>${preview}` : ''}
        ${imageBlock}

        <label>Alternativ ${isGenerated ? '' : '(klicka radioknapp för rätt svar)'}</label>
        ${optionsBlock}

        <label>Förklaring (svenska)</label>
        <textarea name="explanationSv">${esc(it.explanationSv ?? '')}</textarea>

        <label>Förklaring (engelska)</label>
        <textarea name="explanationEn">${esc(it.explanationEn ?? '')}</textarea>

        <label>Granskningsanteckning (needsReviewNote)</label>
        <textarea name="needsReviewNote" placeholder="Lämna tomt om inget att flagga">${esc(it.needsReviewNote ?? '')}</textarea>

        ${it.sourceRef ? `<div class="sourceRef">sourceRef: ${esc(it.sourceRef)}</div>` : ''}
        ${photosBlock}

        <div class="save-bar">
          <button type="submit" name="action" value="approve" class="approve">✓ Spara &amp; godkänn</button>
          <button type="submit" name="action" value="flag" class="flag">⚑ Spara &amp; flagga</button>
          <button type="submit" name="action" value="save">Spara utan att ändra status</button>
        </div>
      </form>
    </main>`,
  );
}

// --- server ---------------------------------------------------------------
function contentTypeFor(file) {
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function serveFile(res, file) {
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': contentTypeFor(file) });
  fs.createReadStream(file).pipe(res);
}

function collectBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => resolve(body));
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/' && req.method === 'GET') {
    const items = buildIndex();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(listView(items, parsed.query));
    return;
  }

  if (parsed.pathname.startsWith('/item/') && req.method === 'GET') {
    const id = decodeURIComponent(parsed.pathname.slice('/item/'.length));
    const items = buildIndex();
    const entry = items.find((e) => e.item.id === id);
    if (!entry) {
      res.writeHead(404);
      res.end('item not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(detailView(entry, items));
    return;
  }

  if (parsed.pathname.startsWith('/item/') && req.method === 'POST') {
    const id = decodeURIComponent(parsed.pathname.slice('/item/'.length));
    const entry = buildIndex().find((e) => e.item.id === id);
    if (!entry) {
      res.writeHead(404);
      res.end('item not found');
      return;
    }
    const bodyStr = await collectBody(req);
    const form = new url.URLSearchParams(bodyStr);

    saveItem(entry, (item) => {
      const q = form.get('questionSv');
      if (q !== null) item.payload = { ...item.payload, questionSv: q };

      if (Array.isArray(item.options)) {
        const correctIdx = Number(form.get('correct'));
        item.options = item.options.map((o, i) => ({
          text: form.get(`opt_${i}`) ?? o.text,
          isCorrect: i === correctIdx,
        }));
      }

      const expSv = form.get('explanationSv');
      if (expSv !== null) item.explanationSv = expSv;
      const expEn = form.get('explanationEn');
      if (expEn !== null) item.explanationEn = expEn;

      const note = form.get('needsReviewNote') ?? '';
      const action = form.get('action');
      if (action === 'approve') {
        item.authorReviewed = true;
        item.needsReview = false;
        item.needsReviewNote = null;
      } else if (action === 'flag') {
        item.authorReviewed = false;
        item.needsReview = true;
        item.needsReviewNote = note || 'Flaggad utan anteckning — komplettera.';
      } else {
        // save-without-status-change: keep authorReviewed/needsReview as-is,
        // but let a note edit persist if the reviewer typed one.
        item.needsReviewNote = note || item.needsReviewNote || null;
      }
    });

    res.writeHead(302, { Location: '/item/' + encodeURIComponent(id) + '?saved=1' });
    res.end();
    return;
  }

  if (parsed.pathname.startsWith('/photo/')) {
    const name = decodeURIComponent(parsed.pathname.slice('/photo/'.length));
    serveFile(res, path.join(QUESTIONS_DIR, name));
    return;
  }

  if (parsed.pathname.startsWith('/asset/')) {
    const rel = decodeURIComponent(parsed.pathname.slice('/asset/'.length));
    serveFile(res, path.join(ASSETS_DIR, rel));
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  const items = buildIndex();
  const reviewed = items.filter((e) => e.item.authorReviewed).length;
  console.log(`Granskningsverktyg igång: http://localhost:${PORT}`);
  console.log(`${reviewed} / ${items.length} redan granskade.`);
  console.log('Ctrl+C för att stänga. Ändringar sparas direkt till content/*.json.');
});
