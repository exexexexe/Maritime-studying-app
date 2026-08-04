/**
 * Maritime light-characteristic parser — the foundation for "rhythm as
 * language" (see DESIGN-RHYTHM.md). Turns standard notation like
 * "Fl(2) 6s", "Q(6)+LFl 15s" or "Mo(K) 10s" into a timed on/off segment
 * sequence that AnimatedLight can play back.
 *
 * This is a real parser for the notation *family* used throughout the
 * app's content (base type + optional group/composite + optional morse
 * letter + optional period), not a lookup table — any future content
 * authored in standard notation works without code changes. Timing
 * constants follow conventional IALA/Admiralty light-characteristic
 * practice (flash ≈1s, long flash ≥2s, Q ≈60/min, VQ ≈120/min, brief
 * eclipse ≈1s) rather than any single real light's exact photometric
 * spec — the goal is a legible, correctly-shaped rhythm, not certification.
 */

export interface LightSegment {
  on: boolean;
  ms: number;
  /** 0–1, only meaningful when `on`. Lets "fixed and flashing" show a dim
   * baseline with a brighter overlay flash without a second light. */
  intensity?: number;
}

export interface LightCharacteristic {
  /** Original notation, e.g. "Fl(2) 6s". */
  raw: string;
  /** Human-readable Swedish name of the base type. */
  nameSv: string;
  /** Total duration of one loop, in ms (sum of segments). */
  periodMs: number;
  /** One full period; AnimatedLight loops this indefinitely. */
  segments: LightSegment[];
}

// --- timing constants (documented conventions, not exact photometrics) ---
const SHORT_FLASH_MS = 1000; // Fl: a flash shorter than 2s
const LONG_FLASH_MS = 2000; // LFl: a flash of at least 2s
const WITHIN_GROUP_GAP_MS = 1000; // dark between flashes in the same group
const COMPOSITE_GROUP_GAP_MS = 2000; // dark between sub-groups, e.g. Fl(1+4)
const ECLIPSE_MS = 1000; // Oc: the brief dark break in an otherwise-lit period
const Q_FLASH_MS = 300;
const Q_GAP_MS = 700; // Q cycle 1000ms ⇒ 60 flashes/min
const VQ_FLASH_MS = 150;
const VQ_GAP_MS = 350; // VQ cycle 500ms ⇒ 120 flashes/min
const IQ_ECLIPSE_MS = 6000; // long dark break that interrupts quick flashing
const MORSE_DOT_MS = 600;
const MORSE_DASH_MS = 1800; // 3× dot, standard Morse proportion
const MORSE_GAP_MS = 600; // between elements of the same letter
const FFL_BASE_INTENSITY = 0.55; // dim baseline for "fixed and flashing"

// IALA standard cardinal-mark periods, used when the notation omits one
// (as it usually does in running text — "grupper om tre snabba blixtar…").
// East=3, West=9, South=6(+LFl); North has no group/period at all.
const CARDINAL_PERIOD_MS: Record<'Q' | 'VQ', Record<number, number>> = {
  Q: { 3: 10000, 6: 15000, 9: 15000 },
  VQ: { 3: 5000, 6: 10000, 9: 10000 },
};

/** Morse letters actually used in maritime light characteristics. */
const MORSE: Record<string, ('dot' | 'dash')[]> = {
  A: ['dot', 'dash'],
  D: ['dash', 'dot', 'dot'],
  K: ['dash', 'dot', 'dash'],
  U: ['dot', 'dot', 'dash'],
};

const NAMES_SV: Record<string, string> = {
  F: 'Fast sken',
  Fl: 'Blixt',
  LFl: 'Lång blixt',
  Q: 'Snabbblixt',
  VQ: 'Mycket snabb blixt',
  IQ: 'Avbruten snabbblixt',
  Iso: 'Isofas',
  Oc: 'Klipp',
  Mo: 'Morse',
};

function flashSegments(count: number, flashMs: number, gapMs: number): LightSegment[] {
  const segs: LightSegment[] = [];
  for (let i = 0; i < count; i++) {
    segs.push({ on: true, ms: flashMs });
    if (i < count - 1) segs.push({ on: false, ms: gapMs });
  }
  return segs;
}

function withRemainder(segs: LightSegment[], periodMs: number): LightSegment[] {
  const used = segs.reduce((sum, s) => sum + s.ms, 0);
  const remainder = periodMs - used;
  if (remainder > 0) return [...segs, { on: false, ms: remainder }];
  if (remainder < 0) {
    throw new Error(`characteristic segments (${used}ms) exceed stated period (${periodMs}ms)`);
  }
  return segs;
}

/**
 * Parse standard light-characteristic notation. Throws on notation this
 * parser doesn't recognize — callers should treat that as a content-authoring
 * error to fix, not something to silently fall back on.
 */
export function parseCharacteristic(spec: string): LightCharacteristic {
  const raw = spec.trim();

  // "FR"/"FG"/"FW"/"FY" — fixed light + colour mnemonic squashed together
  // with no space (colour is a separate field on the light itself in our
  // data model, so we just need this shorthand to parse as plain "F").
  const fixedColorAlias = raw.match(/^F([RGWY])$/);
  if (fixedColorAlias) {
    return { raw, nameSv: NAMES_SV.F, periodMs: 1, segments: [{ on: true, ms: 1 }] };
  }

  const periodMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*s\s*$/);
  const periodMs = periodMatch ? Math.round(parseFloat(periodMatch[1].replace(',', '.')) * 1000) : null;
  const withoutPeriod = periodMatch ? raw.slice(0, periodMatch.index).trim() : raw;

  // "F Fl" — fixed light with a periodic brighter flash overlaid.
  if (/^F\s+Fl$/.test(withoutPeriod)) {
    if (!periodMs) throw new Error(`"${raw}": F Fl requires a stated period`);
    const segs: LightSegment[] = withRemainder(
      [{ on: true, ms: SHORT_FLASH_MS, intensity: 1 }],
      periodMs,
    ).map((s, i) => (i === 0 ? s : { ...s, on: true, intensity: FFL_BASE_INTENSITY }));
    return { raw, nameSv: 'Fast sken med blixt', periodMs, segments: segs };
  }

  // Group / composite / morse-letter suffix in parentheses, e.g. "(2)",
  // "(1+4)", "(K)". Optional trailing "+LFl" / "LFl" (no plus, seen in
  // some sources) for the cardinal-mark quick/very-quick + long-flash form.
  const m = withoutPeriod.match(
    /^(F|LFl|Fl|VQ|Q|IQ|Iso|Oc|Mo)(?:\(([^)]+)\))?\s*(?:\+?\s*(LFl))?$/,
  );
  if (!m) throw new Error(`"${raw}": unrecognized light characteristic notation`);
  const [, base, group, lflSuffix] = m;
  const nameSv = NAMES_SV[base] ?? base;

  switch (base) {
    case 'F': {
      // Continuously on — no meaningful period; represent as one segment.
      return { raw, nameSv, periodMs: periodMs ?? 1, segments: [{ on: true, ms: periodMs ?? 1 }] };
    }

    case 'Mo': {
      if (!group) throw new Error(`"${raw}": Mo requires a letter, e.g. Mo(K)`);
      const letter = group.toUpperCase();
      const pattern = MORSE[letter];
      if (!pattern) throw new Error(`"${raw}": no Morse pattern for letter "${letter}"`);
      if (!periodMs) throw new Error(`"${raw}": Mo requires a stated period`);
      const segs: LightSegment[] = [];
      pattern.forEach((el, i) => {
        segs.push({ on: true, ms: el === 'dot' ? MORSE_DOT_MS : MORSE_DASH_MS });
        if (i < pattern.length - 1) segs.push({ on: false, ms: MORSE_GAP_MS });
      });
      return { raw, nameSv: `${nameSv} (${letter})`, periodMs, segments: withRemainder(segs, periodMs) };
    }

    case 'Iso': {
      if (!periodMs) throw new Error(`"${raw}": Iso requires a stated period`);
      const half = periodMs / 2;
      return { raw, nameSv, periodMs, segments: [{ on: true, ms: half }, { on: false, ms: periodMs - half }] };
    }

    case 'Oc': {
      if (!periodMs) throw new Error(`"${raw}": Oc requires a stated period`);
      const count = group ? Number(group) : 1;
      if (!Number.isInteger(count) || count < 1) throw new Error(`"${raw}": bad Oc group count`);
      // Light with N brief eclipses; time between eclipses shares the
      // remaining "on" budget evenly.
      const onBudget = periodMs - count * ECLIPSE_MS;
      if (onBudget <= 0) throw new Error(`"${raw}": period too short for ${count} eclipse(s)`);
      const onEach = onBudget / count;
      const segs: LightSegment[] = [];
      for (let i = 0; i < count; i++) {
        segs.push({ on: true, ms: onEach });
        segs.push({ on: false, ms: ECLIPSE_MS });
      }
      return { raw, nameSv: count > 1 ? `Gruppklipp (${count})` : nameSv, periodMs, segments: segs };
    }

    case 'Fl':
    case 'LFl': {
      const flashMs = base === 'LFl' ? LONG_FLASH_MS : SHORT_FLASH_MS;
      if (!group) {
        if (!periodMs) throw new Error(`"${raw}": ${base} requires a stated period`);
        return {
          raw,
          nameSv,
          periodMs,
          segments: withRemainder([{ on: true, ms: flashMs }], periodMs),
        };
      }
      if (!periodMs) throw new Error(`"${raw}": ${base}(${group}) requires a stated period`);
      if (group.includes('+')) {
        // Composite group, e.g. Fl(1+4): sub-groups separated by a longer gap.
        const counts = group.split('+').map(Number);
        if (counts.some((n) => !Number.isInteger(n) || n < 1)) {
          throw new Error(`"${raw}": bad composite group "${group}"`);
        }
        const segs: LightSegment[] = [];
        counts.forEach((n, i) => {
          segs.push(...flashSegments(n, flashMs, WITHIN_GROUP_GAP_MS));
          if (i < counts.length - 1) segs.push({ on: false, ms: COMPOSITE_GROUP_GAP_MS });
        });
        return {
          raw,
          nameSv: `Sammansatt gruppblixt (${group})`,
          periodMs,
          segments: withRemainder(segs, periodMs),
        };
      }
      const count = Number(group);
      if (!Number.isInteger(count) || count < 1) throw new Error(`"${raw}": bad group count "${group}"`);
      return {
        raw,
        nameSv: `Gruppblixt (${count})`,
        periodMs,
        segments: withRemainder(flashSegments(count, flashMs, WITHIN_GROUP_GAP_MS), periodMs),
      };
    }

    case 'Q':
    case 'VQ': {
      const [flashMs, gapMs] = base === 'VQ' ? [VQ_FLASH_MS, VQ_GAP_MS] : [Q_FLASH_MS, Q_GAP_MS];
      if (!group) {
        // Continuous — loop is just one flash cycle, no group/eclipse structure.
        return { raw, nameSv, periodMs: flashMs + gapMs, segments: [{ on: true, ms: flashMs }, { on: false, ms: gapMs }] };
      }
      const count = Number(group);
      if (!Number.isInteger(count) || count < 1) throw new Error(`"${raw}": bad group count "${group}"`);
      const flashes = flashSegments(count, flashMs, gapMs);
      if (lflSuffix) {
        // Cardinal-mark form, e.g. Q(6)+LFl — group immediately followed by
        // one long flash, then dark to fill the period.
        const period = periodMs ?? CARDINAL_PERIOD_MS[base][count];
        if (!period) throw new Error(`"${raw}": no standard period known for ${base}(${count})+LFl`);
        const segs = [...flashes, { on: false, ms: WITHIN_GROUP_GAP_MS }, { on: true, ms: LONG_FLASH_MS }];
        return {
          raw,
          nameSv: `${nameSv}(${count}) + lång blixt — sydkardinal`,
          periodMs: period,
          segments: withRemainder(segs, period),
        };
      }
      const period = periodMs ?? CARDINAL_PERIOD_MS[base][count];
      if (!period) throw new Error(`"${raw}": ${base}(${group}) requires a stated period`);
      return {
        raw,
        nameSv: `${nameSv}(${count})`,
        periodMs: period,
        segments: withRemainder(flashes, period),
      };
    }

    case 'IQ': {
      if (!periodMs) throw new Error(`"${raw}": IQ requires a stated period`);
      if (periodMs <= IQ_ECLIPSE_MS) throw new Error(`"${raw}": period too short for IQ's eclipse`);
      const quickSpan = periodMs - IQ_ECLIPSE_MS;
      const segs: LightSegment[] = [];
      let elapsed = 0;
      let on = true;
      while (elapsed < quickSpan) {
        const ms = Math.min(on ? Q_FLASH_MS : Q_GAP_MS, quickSpan - elapsed);
        segs.push({ on, ms });
        elapsed += ms;
        on = !on;
      }
      segs.push({ on: false, ms: IQ_ECLIPSE_MS });
      return { raw, nameSv, periodMs, segments: segs };
    }

    default:
      throw new Error(`"${raw}": unhandled base type "${base}"`);
  }
}
