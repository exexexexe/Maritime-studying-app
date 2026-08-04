/**
 * Surgical JSON patching: replace exactly one item in a content/*.json
 * file's `items` array, leaving every other byte untouched.
 *
 * Why not `JSON.stringify(doc, null, 2)` and rewrite the whole file?
 * Several hand-authored content files use compact one-line formatting for
 * small arrays/objects (e.g. `"tracks": ["klass8"]`, one-line option
 * objects). Re-serializing the whole document on every save would expand
 * all of that on the very first review click, burying real content edits
 * under thousands of lines of pure formatting noise in git history. This
 * patcher finds only the target item's substring (via bracket-depth
 * scanning, string-aware) and replaces it with a freshly rendered version,
 * indented to match its surrounding context. Everything else in the file
 * — including other items' original formatting — is preserved exactly.
 */

/** Find {start, end} char offsets of each top-level element of the first
 * `"items": [ ... ]` array in `text`. */
function findItemRanges(text) {
  const itemsKeyIdx = text.indexOf('"items"');
  if (itemsKeyIdx === -1) throw new Error('no "items" key found');
  const arrStart = text.indexOf('[', itemsKeyIdx);

  let depth = 0;
  let inStr = false;
  let esc = false;
  let elStart = -1;
  const ranges = [];

  for (let i = arrStart; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === '[' || ch === '{') {
      if (depth === 1 && ch === '{' && elStart === -1) elStart = i;
      depth++;
      continue;
    }
    if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 1 && ch === '}' && elStart !== -1) {
        ranges.push({ start: elStart, end: i + 1 });
        elStart = -1;
      }
      if (depth === 0) break; // closed the items array itself
    }
  }
  return ranges;
}

/**
 * Replace the item with id `id` inside `text` (raw file contents) with
 * `newItem`, preserving the rest of the file byte-for-byte. Throws if the
 * item isn't found — callers should treat that as "someone else changed
 * the file layout, re-read and retry" rather than silently no-op.
 */
function replaceItemInSource(text, id, newItem) {
  for (const { start, end } of findItemRanges(text)) {
    const sub = text.slice(start, end);
    let parsed;
    try {
      parsed = JSON.parse(sub);
    } catch {
      continue;
    }
    if (parsed.id !== id) continue;

    const lineStart = text.lastIndexOf('\n', start) + 1;
    const indent = text.slice(lineStart, start); // leading whitespace before this item's '{'
    const rendered = JSON.stringify(newItem, null, 2)
      .split('\n')
      .map((line, i) => (i === 0 ? line : indent + line))
      .join('\n');
    return text.slice(0, start) + rendered + text.slice(end);
  }
  throw new Error(`item "${id}" not found in items array`);
}

module.exports = { findItemRanges, replaceItemInSource };
