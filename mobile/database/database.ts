import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';

const DATABASE_NAME = 'app.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  // WAL allows concurrent readers/writers without blocking each other;
  // foreign_keys must be turned on per-connection (SQLite default is off).
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

// Memoizes the open+migrate *promise*, not just the result, so concurrent
// callers during app startup await the same in-flight open instead of each
// opening (and migrating) the file independently.
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndMigrate();
  }
  return databasePromise;
}

// Call once at app startup so the DB is open and migrated before any
// repository call needs it. Safe to call more than once — subsequent calls
// resolve the same memoized promise.
export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}
