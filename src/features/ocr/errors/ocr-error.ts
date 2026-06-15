export type OcrErrorCode =
  | "missing_image"
  | "recognition_failed"
  | "cleanup_failed"
  | "invalid_result"
  | "not_available";

export class OcrError extends Error {
  readonly code: OcrErrorCode;
  override readonly cause?: unknown;

  constructor(code: OcrErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "OcrError";
    this.code = code;
    this.cause = cause;
  }
}

export function isOcrError(error: unknown): error is OcrError {
  return error instanceof OcrError;
}
