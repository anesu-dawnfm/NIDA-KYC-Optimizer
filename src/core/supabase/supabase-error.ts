export type SupabaseErrorCode =
  | "client_not_configured"
  | "request_failed"
  | "record_not_found";

export class SupabaseError extends Error {
  readonly code: SupabaseErrorCode;
  override readonly cause?: unknown;

  constructor(code: SupabaseErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "SupabaseError";
    this.code = code;
    this.cause = cause;
  }
}
