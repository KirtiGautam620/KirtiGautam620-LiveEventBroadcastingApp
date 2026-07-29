import { openDatabaseSync } from 'expo-sqlite';

// Single shared local database handle for the app's offline cache
// (e.g. chat messages queued while offline, read-through stream lists).
// Schema/migrations for this database will be introduced alongside the
// features that need them.
export const db = openDatabaseSync('app.db');
