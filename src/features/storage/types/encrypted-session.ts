export type SyncStatus = "pending" | "synced" | "failed";

export type EncryptedSessionRecord = {
  sessionId: string;
  dedupeKey?: string | null;
  encryptedPayload: string;
  timestamp: string;
  syncStatus: SyncStatus;
};

export type CreateEncryptedSessionInput = {
  sessionId?: string;
  dedupeKey?: string | null;
  payload: unknown;
  timestamp?: string;
  syncStatus?: SyncStatus;
};

export type PersistedEncryptedSession = EncryptedSessionRecord & {
  id: number;
};
