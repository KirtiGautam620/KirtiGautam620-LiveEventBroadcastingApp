import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

// Ordered by version. Each entry only ever runs once per device — see
// runMigrations() below, which gates on PRAGMA user_version.
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS pending_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          stream_id TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          content TEXT NOT NULL,
          client_created_at TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
          retry_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_pending_messages_status_id
          ON pending_messages (status, id);
      `);
    },
  },
];

// PRAGMA user_version is SQLite's built-in schema-version counter (defaults
// to 0 on a fresh database). Running this on every app start is safe and
// idempotent: migrations whose version is <= the stored version are skipped.
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  const pending = MIGRATIONS.filter((migration) => migration.version > currentVersion).sort(
    (a, b) => a.version - b.version,
  );

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
    });
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
  }
}
