export type StorageErrorCode =
  | "encryption_key_missing"
  | "encryption_failed"
  | "decryption_failed"
  | "database_write_failed"
  | "database_read_failed"
  | "database_delete_failed"
  | "invalid_payload";

export class StorageError extends Error {
  override readonly name = "StorageError";
  readonly code: StorageErrorCode;
  override readonly cause?: unknown;

  constructor(code: StorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.cause = cause;
  }
}
