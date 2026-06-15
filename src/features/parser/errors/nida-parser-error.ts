export type NidaParserErrorCode = "empty_input" | "parse_failed";

export class NidaParserError extends Error {
  override readonly name = "NidaParserError";
  readonly code: NidaParserErrorCode;
  override readonly cause?: unknown;

  constructor(
    code: NidaParserErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.code = code;
    this.cause = cause;
  }
}
