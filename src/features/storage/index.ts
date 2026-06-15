export { StorageError, type StorageErrorCode } from "./errors/storage-error";
export {
  decryptPayload,
  encryptPayload,
  getOrCreateEncryptionKey,
} from "./services/storage-crypto";
export { initializeStorageSchema } from "./services/storage-database";
export {
  SQLiteSessionStorageRepository,
  type SessionStorageRepository,
} from "./repositories/session-storage-repository";
export type {
  CreateEncryptedSessionInput,
  EncryptedSessionRecord,
  PersistedEncryptedSession,
  SyncStatus,
} from "./types/encrypted-session";
