import * as SQLite from 'expo-sqlite';

/**
 * Data-access layer for Plugga Sjöexamen.
 *
 * All persistence goes through this module — screens never touch SQLite
 * directly. This is the seam where a future self-hosted sync backend would
 * plug in without rewriting callers.
 *
 * Schema changes are append-only migrations; never edit a shipped migration.
 */

const MIGRATIONS: string[] = [
  // 1 — meta key/value store (also serves as the Phase 1 persistence check)
  `CREATE TABLE IF NOT EXISTS meta (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   );`,
];

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('plugga-sjoexamen.db');
    db.execSync('PRAGMA journal_mode = WAL;');
    db.execSync('PRAGMA foreign_keys = ON;');
    migrate(db);
  }
  return db;
}

function migrate(database: SQLite.SQLiteDatabase) {
  const { user_version: current } = database.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version;',
  )!;
  for (let v = current; v < MIGRATIONS.length; v++) {
    database.withTransactionSync(() => {
      database.execSync(MIGRATIONS[v]);
      database.execSync(`PRAGMA user_version = ${v + 1};`);
    });
  }
}

export function getMeta(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?;',
    key,
  );
  return row?.value ?? null;
}

export function setMeta(key: string, value: string): void {
  getDb().runSync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    key,
    value,
  );
}

/** Phase 1 offline-persistence check: counts app launches across restarts. */
export function bumpLaunchCount(): number {
  const next = Number(getMeta('launch_count') ?? '0') + 1;
  setMeta('launch_count', String(next));
  return next;
}
