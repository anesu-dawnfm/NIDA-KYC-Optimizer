export type SyncStatus = "pending" | "synced" | "failed";

export type EncryptedSessionRecord = {
  sessionId: string;
  encryptedPayload: string;
  timestamp: string;
  syncStatus: SyncStatus;
};

export type CreateEncryptedSessionInput = {
  sessionId?: string;
  payload: unknown;
  timestamp?: string;
  syncStatus?: SyncStatus;
};

export type PersistedEncryptedSession = EncryptedSessionRecord & {
  id: number;
};
