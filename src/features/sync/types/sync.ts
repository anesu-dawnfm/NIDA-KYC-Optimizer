import type { PersistedEncryptedSession, SyncStatus } from "@/features/storage";

export type SyncNetworkType = "offline" | "wifi" | "mobile";

export type SyncSubmissionOptions = {
  sessionId?: string;
  dedupeKey?: string;
  timestamp?: string;
};

export type SyncSubmissionResult = {
  record: PersistedEncryptedSession;
  dedupeKey: string;
  queued: boolean;
};

export type SyncRunSummary = {
  syncedCount: number;
  failedCount: number;
  totalCount: number;
  queueCount: number;
  nextRetryAt: string | null;
};

export type SyncTransportPayload = {
  sessionId: string;
  dedupeKey: string | null | undefined;
  timestamp: string;
  syncStatus: SyncStatus;
  payload: unknown;
};
