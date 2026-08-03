/**
 * Jest stand-in for expo-sqlite, backed by Node's built-in sqlite
 * (node:sqlite, Node 22+). Same SQL engine family as the device, so
 * migrations and queries are exercised for real in integration tests.
 *
 * Wired up via the "moduleNameMapper" entry in package.json.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require('node:sqlite');

type Params = (string | number | null)[];

class MockSQLiteDatabase {
  private db = new DatabaseSync(':memory:');

  execSync(sql: string): void {
    this.db.exec(sql);
  }

  runSync(sql: string, ...params: Params): void {
    this.db.prepare(sql).run(...params);
  }

  getFirstSync<T>(sql: string, ...params: Params): T | null {
    return (this.db.prepare(sql).get(...params) as T | undefined) ?? null;
  }

  getAllSync<T>(sql: string, ...params: Params): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  withTransactionSync(cb: () => void): void {
    this.db.exec('BEGIN');
    try {
      cb();
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
}

export function openDatabaseSync(_name: string): MockSQLiteDatabase {
  return new MockSQLiteDatabase();
}
