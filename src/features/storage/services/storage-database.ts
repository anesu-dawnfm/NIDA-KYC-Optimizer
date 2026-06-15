import * as SQLite from "expo-sqlite";

import { StorageError } from "@/features/storage/errors/storage-error";

const DATABASE_NAME = "kyc_optimizer.db";

export async function openStorageDatabase() {
  return SQLite.openDatabaseAsync(DATABASE_NAME);
}

export async function initializeStorageSchema() {
  const db = await openStorageDatabase();

  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS encrypted_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL UNIQUE,
        dedupe_key TEXT,
        encrypted_payload TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        sync_status TEXT NOT NULL CHECK(sync_status IN ('pending', 'synced', 'failed'))
      );
    `);

    const columns = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(encrypted_sessions)`,
    );
    const columnNames = new Set(columns.map((column) => column.name));

    if (!columnNames.has("dedupe_key")) {
      await db.execAsync(
        `ALTER TABLE encrypted_sessions ADD COLUMN dedupe_key TEXT;`,
      );
    }

    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_encrypted_sessions_dedupe_key
      ON encrypted_sessions(dedupe_key);
    `);
  } catch (cause) {
    throw new StorageError(
      "database_write_failed",
      "Failed to initialize storage schema.",
      cause,
    );
  }
}
