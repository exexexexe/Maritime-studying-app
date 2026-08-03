import * as SQLite from 'expo-sqlite';

import type { Track } from '@/content/types';

import type { ExamSessionRecord, ReviewRecord, Storage } from './storage';

/** Schema changes are append-only migrations; never edit a shipped migration. */
const MIGRATIONS: string[] = [
  // 1 — meta key/value store (also serves as the Phase 1 persistence check)
  `CREATE TABLE IF NOT EXISTS meta (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   );`,
  // 2 — SM-2 review state, kept per (item, track): a user studying two
  // tracks has independent schedules for each.
  `CREATE TABLE IF NOT EXISTS reviews (
     item_id TEXT NOT NULL,
     track TEXT NOT NULL,
     ease_factor REAL NOT NULL,
     interval_days REAL NOT NULL,
     repetitions INTEGER NOT NULL,
     due_at INTEGER NOT NULL,
     last_result INTEGER,
     updated_at INTEGER NOT NULL,
     PRIMARY KEY (item_id, track)
   );
   CREATE INDEX IF NOT EXISTS idx_reviews_track_due ON reviews (track, due_at);`,
  // 3 — exam sessions (quick/full simulations), incl. per-module tally JSON
  `CREATE TABLE IF NOT EXISTS exam_sessions (
     id TEXT PRIMARY KEY NOT NULL,
     track TEXT NOT NULL,
     mode TEXT NOT NULL,
     started_at INTEGER NOT NULL,
     finished_at INTEGER,
     items_attempted INTEGER NOT NULL DEFAULT 0,
     correct INTEGER NOT NULL DEFAULT 0,
     score_pct REAL,
     passed INTEGER,
     module_results TEXT
   );
   CREATE INDEX IF NOT EXISTS idx_exam_track_started ON exam_sessions (track, started_at DESC);`,
];

interface RawReviewRow {
  item_id: string;
  track: Track;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: number;
  last_result: number | null;
  updated_at: number;
}

function fromRaw(r: RawReviewRow): ReviewRecord {
  return {
    itemId: r.item_id,
    track: r.track,
    easeFactor: r.ease_factor,
    intervalDays: r.interval_days,
    repetitions: r.repetitions,
    dueAt: r.due_at,
    lastResult: r.last_result === null ? null : r.last_result === 1,
    updatedAt: r.updated_at,
  };
}

export function createSqliteStorage(): Storage {
  const db = SQLite.openDatabaseSync('plugga-sjoexamen.db');
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  const { user_version: current } = db.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version;',
  )!;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[v]);
      db.execSync(`PRAGMA user_version = ${v + 1};`);
    });
  }

  return {
    getMeta(key) {
      const row = db.getFirstSync<{ value: string }>(
        'SELECT value FROM meta WHERE key = ?;',
        key,
      );
      return row?.value ?? null;
    },

    setMeta(key, value) {
      db.runSync(
        'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
        key,
        value,
      );
    },

    getReview(itemId, track) {
      const row = db.getFirstSync<RawReviewRow>(
        'SELECT * FROM reviews WHERE item_id = ? AND track = ?;',
        itemId,
        track,
      );
      return row ? fromRaw(row) : null;
    },

    getReviewsForTrack(track) {
      return db
        .getAllSync<RawReviewRow>('SELECT * FROM reviews WHERE track = ?;', track)
        .map(fromRaw);
    },

    dueItemIds(track, now) {
      return db
        .getAllSync<{ item_id: string }>(
          'SELECT item_id FROM reviews WHERE track = ? AND due_at <= ? ORDER BY due_at ASC;',
          track,
          now,
        )
        .map((r) => r.item_id);
    },

    upsertReview(rec) {
      db.runSync(
        `INSERT INTO reviews
           (item_id, track, ease_factor, interval_days, repetitions, due_at, last_result, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(item_id, track) DO UPDATE SET
           ease_factor = excluded.ease_factor,
           interval_days = excluded.interval_days,
           repetitions = excluded.repetitions,
           due_at = excluded.due_at,
           last_result = excluded.last_result,
           updated_at = excluded.updated_at;`,
        rec.itemId,
        rec.track,
        rec.easeFactor,
        rec.intervalDays,
        rec.repetitions,
        rec.dueAt,
        rec.lastResult === null ? null : rec.lastResult ? 1 : 0,
        rec.updatedAt,
      );
    },

    upsertExamSession(rec) {
      db.runSync(
        `INSERT INTO exam_sessions
           (id, track, mode, started_at, finished_at, items_attempted, correct, score_pct, passed, module_results)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           finished_at = excluded.finished_at,
           items_attempted = excluded.items_attempted,
           correct = excluded.correct,
           score_pct = excluded.score_pct,
           passed = excluded.passed,
           module_results = excluded.module_results;`,
        rec.id,
        rec.track,
        rec.mode,
        rec.startedAt,
        rec.finishedAt,
        rec.itemsAttempted,
        rec.correct,
        rec.scorePct,
        rec.passed === null ? null : rec.passed ? 1 : 0,
        rec.moduleResults,
      );
    },

    listExamSessions(track) {
      interface Raw {
        id: string;
        track: ExamSessionRecord['track'];
        mode: ExamSessionRecord['mode'];
        started_at: number;
        finished_at: number | null;
        items_attempted: number;
        correct: number;
        score_pct: number | null;
        passed: number | null;
        module_results: string | null;
      }
      return db
        .getAllSync<Raw>(
          'SELECT * FROM exam_sessions WHERE track = ? ORDER BY started_at DESC;',
          track,
        )
        .map((r) => ({
          id: r.id,
          track: r.track,
          mode: r.mode,
          startedAt: r.started_at,
          finishedAt: r.finished_at,
          itemsAttempted: r.items_attempted,
          correct: r.correct,
          scorePct: r.score_pct,
          passed: r.passed === null ? null : r.passed === 1,
          moduleResults: r.module_results,
        }));
    },
  };
}
