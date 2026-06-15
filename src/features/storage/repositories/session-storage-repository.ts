import type { CreateEncryptedSessionInput, EncryptedSessionRecord, PersistedEncryptedSession, SyncStatus } from "@/features/storage/types/encrypted-session";
import { StorageError } from "@/features/storage/errors/storage-error";
import { createSessionId, decryptPayload, encryptPayload, getOrCreateEncryptionKey } from "@/features/storage/services/storage-crypto";
import { initializeStorageSchema, openStorageDatabase } from "@/features/storage/services/storage-database";

export interface SessionStorageRepository {
  create(input: CreateEncryptedSessionInput): Promise<PersistedEncryptedSession>;
  findBySessionId(sessionId: string): Promise<PersistedEncryptedSession | null>;
  list(): Promise<PersistedEncryptedSession[]>;
  updateSyncStatus(sessionId: string, syncStatus: SyncStatus): Promise<void>;
  delete(sessionId: string): Promise<void>;
  hydratePayload<T>(record: EncryptedSessionRecord): Promise<T>;
}

export class SQLiteSessionStorageRepository implements SessionStorageRepository {
  async create(input: CreateEncryptedSessionInput): Promise<PersistedEncryptedSession> {
    await initializeStorageSchema();
    await getOrCreateEncryptionKey();
    const db = await openStorageDatabase();

    const sessionId = input.sessionId ?? createSessionId();
    const timestamp = input.timestamp ?? new Date().toISOString();
    const syncStatus = input.syncStatus ?? "pending";
    const encryptedPayload = await encryptPayload(input.payload);

    try {
      const result = await db.runAsync(
        `INSERT INTO encrypted_sessions (session_id, encrypted_payload, timestamp, sync_status)
         VALUES (?, ?, ?, ?)`,
        sessionId,
        encryptedPayload,
        timestamp,
        syncStatus,
      );

      return {
        id: Number(result.lastInsertRowId),
        sessionId,
        encryptedPayload,
        timestamp,
        syncStatus,
      };
    } catch (cause) {
      throw new StorageError(
        "database_write_failed",
        "Failed to create encrypted session.",
        cause,
      );
    }
  }

  async findBySessionId(sessionId: string): Promise<PersistedEncryptedSession | null> {
    await initializeStorageSchema();
    const db = await openStorageDatabase();

    try {
      const row = await db.getFirstAsync<EncryptedSessionRow>(
        `SELECT id, session_id, encrypted_payload, timestamp, sync_status
         FROM encrypted_sessions
         WHERE session_id = ?`,
        sessionId,
      );

      return row ? mapRow(row) : null;
    } catch (cause) {
      throw new StorageError(
        "database_read_failed",
        "Failed to read encrypted session.",
        cause,
      );
    }
  }

  async list(): Promise<PersistedEncryptedSession[]> {
    await initializeStorageSchema();
    const db = await openStorageDatabase();

    try {
      const rows = await db.getAllAsync<EncryptedSessionRow>(
        `SELECT id, session_id, encrypted_payload, timestamp, sync_status
         FROM encrypted_sessions
         ORDER BY timestamp DESC`,
      );

      return rows.map(mapRow);
    } catch (cause) {
      throw new StorageError(
        "database_read_failed",
        "Failed to list encrypted sessions.",
        cause,
      );
    }
  }

  async updateSyncStatus(sessionId: string, syncStatus: SyncStatus): Promise<void> {
    await initializeStorageSchema();
    const db = await openStorageDatabase();

    try {
      await db.runAsync(
        `UPDATE encrypted_sessions
         SET sync_status = ?
         WHERE session_id = ?`,
        syncStatus,
        sessionId,
      );
    } catch (cause) {
      throw new StorageError(
        "database_write_failed",
        "Failed to update sync status.",
        cause,
      );
    }
  }

  async delete(sessionId: string): Promise<void> {
    await initializeStorageSchema();
    const db = await openStorageDatabase();

    try {
      await db.runAsync(
        `DELETE FROM encrypted_sessions
         WHERE session_id = ?`,
        sessionId,
      );
    } catch (cause) {
      throw new StorageError(
        "database_delete_failed",
        "Failed to delete encrypted session.",
        cause,
      );
    }
  }

  async hydratePayload<T>(record: EncryptedSessionRecord): Promise<T> {
    return decryptPayload<T>(record.encryptedPayload);
  }
}

type EncryptedSessionRow = {
  id: number;
  session_id: string;
  encrypted_payload: string;
  timestamp: string;
  sync_status: SyncStatus;
};

function mapRow(row: EncryptedSessionRow): PersistedEncryptedSession {
  return {
    id: row.id,
    sessionId: row.session_id,
    encryptedPayload: row.encrypted_payload,
    timestamp: row.timestamp,
    syncStatus: row.sync_status,
  };
}
