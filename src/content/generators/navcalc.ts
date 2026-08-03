import type { Option } from '../types';

/**
 * Seeded calculation generators — the "inexhaustible drill" pattern.
 *
 * A calculation item's payload names a generator; the drill screen calls
 * generate(generatorId, seed) with the per-attempt seed, so every attempt
 * gets fresh numbers but stays stable while on screen. The generated
 * `options` replace the item's static ones (still shuffled by the drill).
 *
 * Sign conventions (Swedish practice): missvisning och deviation anges
 * ostlig (+) / västlig (−).
 *   Rättvisande kurs = Kompasskurs + missvisning + deviation
 *   Kompasskurs      = Rättvisande kurs − missvisning − deviation
 */

export interface GeneratedQuestion {
  questionSv: string;
  options: Option[];
  explanationSv: string;
  /** Numeric answer, exposed for unit tests. */
  answer: number;
}

/** mulberry32, same family as src/lib/shuffle.ts. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r: () => number, min: number, max: number, step = 1) =>
  min + step * Math.floor(r() * ((max - min) / step + 1));

const deg = (v: number) => `${String(((v % 360) + 360) % 360).padStart(3, '0')}°`;
const signed = (v: number) => (v >= 0 ? `+${v}°` : `${v}°`);
const named = (v: number) => `${Math.abs(v)}° ${v >= 0 ? 'ostlig' : 'västlig'}`;

/** Wrap distractor degrees and ensure they differ from the answer. */
function degreeOptions(answer: number, raw: number[]): Option[] {
  const opts: Option[] = [{ text: deg(answer), isCorrect: true }];
  const used = new Set([deg(answer)]);
  for (let d of raw) {
    while (used.has(deg(d))) d += 2;
    used.add(deg(d));
    opts.push({ text: deg(d), isCorrect: false });
  }
  return opts;
}

function numberOptions(answer: number, unit: string, raw: number[]): Option[] {
  const fmt = (v: number) => `${(Math.round(v * 10) / 10).toString().replace('.', ',')} ${unit}`;
  const opts: Option[] = [{ text: fmt(answer), isCorrect: true }];
  const used = new Set([fmt(answer)]);
  for (let d of raw) {
    while (used.has(fmt(d))) d += unit === 'M' ? 0.5 : 0.5;
    used.add(fmt(d));
    opts.push({ text: fmt(d), isCorrect: false });
  }
  return opts;
}

function compassCourse(seed: number): GeneratedQuestion {
  const r = rng(seed);
  const rk = pick(r, 0, 355, 5);
  const miss = (r() < 0.5 ? -1 : 1) * pick(r, 1, 7);
  const dev = (r() < 0.5 ? -1 : 1) * pick(r, 1, 4);
  const answer = rk - miss - dev;
  return {
    questionSv: `Rättvisande kurs är ${deg(rk)}. Missvisningen är ${named(miss)} och deviationen ${named(dev)}. Vilken kompasskurs ska du styra?`,
    options: degreeOptions(answer, [rk + miss + dev, rk - miss + dev, rk + miss - dev]),
    explanationSv:
      `Kompasskurs = rättvisande kurs − missvisning − deviation.\n` +
      `Kk = ${deg(rk)} − (${signed(miss)}) − (${signed(dev)}) = ${deg(answer)}.\n` +
      `Ostlig rättelse är positiv, västlig negativ — vid räkning från rättvisande till kompass byter de tecken.`,
    answer: ((answer % 360) + 360) % 360,
  };
}

function trueCourse(seed: number): GeneratedQuestion {
  const r = rng(seed);
  const kk = pick(r, 0, 355, 5);
  const miss = (r() < 0.5 ? -1 : 1) * pick(r, 1, 7);
  const dev = (r() < 0.5 ? -1 : 1) * pick(r, 1, 4);
  const answer = kk + miss + dev;
  return {
    questionSv: `Du styr kompasskurs ${deg(kk)}. Missvisningen är ${named(miss)} och deviationen ${named(dev)}. Vilken är din rättvisande kurs?`,
    options: degreeOptions(answer, [kk - miss - dev, kk + miss - dev, kk - miss + dev]),
    explanationSv:
      `Rättvisande kurs = kompasskurs + missvisning + deviation.\n` +
      `Rk = ${deg(kk)} + (${signed(miss)}) + (${signed(dev)}) = ${deg(answer)}.\n` +
      `Från kompass till rättvisande läggs rättelserna till med sina tecken.`,
    answer: ((answer % 360) + 360) % 360,
  };
}

const fmtTime = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ''}`.trim() : `${min} min`;

function distance(seed: number): GeneratedQuestion {
  const r = rng(seed);
  const speed = pick(r, 4, 12);
  const minutes = pick(r, 30, 240, 30);
  const answer = (speed * minutes) / 60;
  return {
    questionSv: `Du håller ${speed} knop i ${fmtTime(minutes)}. Hur långt hinner du?`,
    options: numberOptions(answer, 'M', [speed * minutes * 0.01, answer * 2, answer / 2]),
    explanationSv:
      `Distans = fart × tid.\n` +
      `${speed} knop × ${minutes}/60 h = ${(answer).toString().replace('.', ',')} M.\n` +
      `Räkna alltid om tiden till timmar innan du multiplicerar.`,
    answer,
  };
}

function timeRequired(seed: number): GeneratedQuestion {
  const r = rng(seed);
  const speed = pick(r, 4, 12);
  const hours = pick(r, 1, 4) + (r() < 0.5 ? 0.5 : 0);
  const dist = speed * hours;
  const answer = hours * 60;
  return {
    questionSv: `Du ska gå ${dist} M och håller ${speed} knop. Hur lång tid tar det?`,
    options: [
      { text: fmtTime(answer), isCorrect: true },
      { text: fmtTime(answer + 30), isCorrect: false },
      { text: fmtTime(Math.max(30, answer - 30)), isCorrect: false },
      { text: fmtTime(answer * 2), isCorrect: false },
    ],
    explanationSv:
      `Tid = distans / fart.\n` +
      `${dist} M / ${speed} knop = ${hours.toString().replace('.', ',')} h = ${fmtTime(answer)}.`,
    answer,
  };
}

function speedRequired(seed: number): GeneratedQuestion {
  const r = rng(seed);
  const answer = pick(r, 4, 12);
  const minutes = pick(r, 30, 180, 30);
  const dist = (answer * minutes) / 60;
  return {
    questionSv: `Du ska gå ${dist.toString().replace('.', ',')} M på ${fmtTime(minutes)}. Vilken fart krävs?`,
    options: numberOptions(answer, 'knop', [answer + 2, Math.max(1, answer - 2), answer + 4]),
    explanationSv:
      `Fart = distans / tid.\n` +
      `${dist.toString().replace('.', ',')} M / (${minutes}/60 h) = ${answer} knop.`,
    answer,
  };
}

function currentSpeed(seed: number): GeneratedQuestion {
  const r = rng(seed);
  const speedThroughWater = pick(r, 5, 12);
  const current = pick(r, 1, 3);
  const against = r() < 0.5;
  const answer = against ? speedThroughWater - current : speedThroughWater + current;
  const dir = against ? 'motström' : 'medström';
  return {
    questionSv: `Din fart genom vattnet är ${speedThroughWater} knop och du har ${current} knop ${dir} rakt längs kursen. Vilken är din fart över grund?`,
    options: numberOptions(answer, 'knop', [
      against ? speedThroughWater + current : speedThroughWater - current,
      speedThroughWater,
      answer + 2,
    ]),
    explanationSv:
      `Fart över grund = fart genom vattnet ${against ? '−' : '+'} ström (rakt ${dir}).\n` +
      `${speedThroughWater} ${against ? '−' : '+'} ${current} = ${answer} knop.\n` +
      `Motström dras ifrån, medström läggs till.`,
    answer,
  };
}

const GENERATORS: Record<string, (seed: number) => GeneratedQuestion> = {
  'compass-course': compassCourse,
  'true-course': trueCourse,
  'std-distance': distance,
  'std-time': timeRequired,
  'std-speed': speedRequired,
  'current-speed': currentSpeed,
};

export const GENERATOR_IDS = Object.keys(GENERATORS);

export function generateCalculation(generatorId: string, seed: number): GeneratedQuestion {
  const gen = GENERATORS[generatorId];
  if (!gen) throw new Error(`Unknown calculation generator "${generatorId}"`);
  return gen(seed);
}
