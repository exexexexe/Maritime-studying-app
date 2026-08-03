import { Platform } from 'react-native';

import type { Storage } from './storage';

/**
 * Data-access layer for Plugga Sjöexamen.
 *
 * All persistence goes through this module and src/db/reviews.ts — screens
 * never touch storage directly. This is the seam where a future self-hosted
 * sync backend would plug in without rewriting callers.
 *
 * Native uses SQLite; web (dev preview only) uses localStorage — see
 * storage.ts for the split.
 */

let storage: Storage | null = null;

export function getStorage(): Storage {
  if (!storage) {
    if (Platform.OS === 'web') {
      const { createWebStorage } = require('./web-storage') as typeof import('./web-storage');
      storage = createWebStorage();
    } else {
      const { createSqliteStorage } =
        require('./sqlite-storage') as typeof import('./sqlite-storage');
      storage = createSqliteStorage();
    }
  }
  return storage;
}

export function getMeta(key: string): string | null {
  return getStorage().getMeta(key);
}

export function setMeta(key: string, value: string): void {
  getStorage().setMeta(key, value);
}

/** Phase 1 offline-persistence check: counts app launches across restarts. */
export function bumpLaunchCount(): number {
  const next = Number(getMeta('launch_count') ?? '0') + 1;
  setMeta('launch_count', String(next));
  return next;
}
